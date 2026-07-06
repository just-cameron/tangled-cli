import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import { getBacklinks } from '../../src/lib/constellation.js';
import {
  createPull,
  getPull,
  getPullState,
  listPulls,
  resolveSequentialPullNumber,
} from '../../src/lib/pulls-api.js';

vi.mock('../../src/lib/constellation.js');

// Mock API client factory
const createMockClient = (authenticated = true): TangledApiClient => {
  const mockAgent = {
    com: {
      atproto: {
        repo: {
          createRecord: vi.fn(),
          getRecord: vi.fn(),
          uploadBlob: vi.fn(),
        },
      },
    },
  };

  return {
    isAuthenticated: vi.fn(() => authenticated),
    getSession: vi.fn(() =>
      authenticated ? { did: 'did:plc:test123', handle: 'test.bsky.social' } : null
    ),
    getAgent: vi.fn(() => mockAgent),
  } as unknown as TangledApiClient;
};

const REPO_AT_URI = 'at://did:plc:owner/sh.tangled.repo/my-repo';
const PULL_AT_URI = 'at://did:plc:test123/sh.tangled.repo.pull/abc123';

describe('createPull', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should upload blob and create pull record', async () => {
    const mockBlob = {
      $type: 'blob',
      ref: { $link: 'bafyreiabc123' },
      mimeType: 'application/gzip',
      size: 42,
    };
    const mockUploadBlob = vi.fn().mockResolvedValue({ data: { blob: mockBlob } });
    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: PULL_AT_URI,
        cid: 'cid123',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            uploadBlob: mockUploadBlob,
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    const patchBuffer = Buffer.from('fake gzip content');
    const result = await createPull({
      client: mockClient,
      repoAtUri: REPO_AT_URI,
      title: 'Add new feature',
      body: 'Description',
      targetBranch: 'main',
      sourceBranch: 'feature/new-thing',
      sourceSha: 'abc123sha',
      patchBuffer,
    });

    expect(mockUploadBlob).toHaveBeenCalledWith(patchBuffer, { encoding: 'application/gzip' });
    expect(mockCreateRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.pull',
      record: expect.objectContaining({
        $type: 'sh.tangled.repo.pull',
        target: { repo: REPO_AT_URI, branch: 'main' },
        title: 'Add new feature',
        body: 'Description',
        patchBlob: mockBlob,
        source: { branch: 'feature/new-thing', sha: 'abc123sha', repo: REPO_AT_URI },
        createdAt: expect.any(String),
      }),
    });

    expect(result).toMatchObject({
      uri: PULL_AT_URI,
      cid: 'cid123',
      author: 'did:plc:test123',
      title: 'Add new feature',
    });
  });

  it('should create pull without body', async () => {
    const mockBlob = {
      $type: 'blob',
      ref: { $link: 'bafyreiabc123' },
      mimeType: 'application/gzip',
      size: 10,
    };
    const mockUploadBlob = vi.fn().mockResolvedValue({ data: { blob: mockBlob } });
    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: { uri: PULL_AT_URI, cid: 'cid123' },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { uploadBlob: mockUploadBlob, createRecord: mockCreateRecord } } },
    } as never);

    const result = await createPull({
      client: mockClient,
      repoAtUri: REPO_AT_URI,
      title: 'Fix bug',
      targetBranch: 'main',
      sourceBranch: 'fix/bug',
      sourceSha: 'deadbeef',
      patchBuffer: Buffer.from('patch'),
    });

    expect(result.body).toBeUndefined();
    expect(result.title).toBe('Fix bug');
  });

  it('should throw when not authenticated', async () => {
    const unauthClient = createMockClient(false);
    await expect(
      createPull({
        client: unauthClient,
        repoAtUri: REPO_AT_URI,
        title: 'Test',
        targetBranch: 'main',
        sourceBranch: 'feature',
        sourceSha: 'abc',
        patchBuffer: Buffer.from('patch'),
      })
    ).rejects.toThrow();
  });
});

describe('listPulls', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 0,
      records: [],
      cursor: null,
    });
  });

  it('should return empty list when no pulls exist', async () => {
    const result = await listPulls({ client: mockClient, repoAtUri: REPO_AT_URI });
    expect(result.pulls).toHaveLength(0);
    expect(result.cursor).toBeUndefined();
  });

  it('should query constellation with correct parameters', async () => {
    await listPulls({ client: mockClient, repoAtUri: REPO_AT_URI, limit: 25 });
    expect(getBacklinks).toHaveBeenCalledWith(
      REPO_AT_URI,
      'sh.tangled.repo.pull',
      '.target.repo',
      25,
      undefined
    );
  });

  it('should fetch records from backlinks and return pulls', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 1,
      records: [{ did: 'did:plc:test123', collection: 'sh.tangled.repo.pull', rkey: 'abc123' }],
      cursor: null,
    });

    const mockRecord = {
      $type: 'sh.tangled.repo.pull',
      target: { repo: REPO_AT_URI, branch: 'main' },
      title: 'Test PR',
      patchBlob: {},
      source: { branch: 'feature', sha: 'abc', repo: REPO_AT_URI },
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const mockGetRecord = vi.fn().mockResolvedValue({
      data: { value: mockRecord, uri: PULL_AT_URI, cid: 'cid123' },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { getRecord: mockGetRecord } } },
    } as never);

    const result = await listPulls({ client: mockClient, repoAtUri: REPO_AT_URI });
    expect(result.pulls).toHaveLength(1);
    expect(result.pulls[0].title).toBe('Test PR');
    expect(result.pulls[0].uri).toBe(PULL_AT_URI);
    expect(result.pulls[0].author).toBe('did:plc:test123');
  });
});

describe('getPull', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should fetch pull record by AT-URI', async () => {
    const mockRecord = {
      $type: 'sh.tangled.repo.pull',
      target: { repo: REPO_AT_URI, branch: 'main' },
      title: 'Test PR',
      patchBlob: {},
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const mockGetRecord = vi.fn().mockResolvedValue({
      data: { value: mockRecord, uri: PULL_AT_URI, cid: 'cid123' },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { getRecord: mockGetRecord } } },
    } as never);

    const result = await getPull({ client: mockClient, pullUri: PULL_AT_URI });
    expect(result.title).toBe('Test PR');
    expect(result.uri).toBe(PULL_AT_URI);
    expect(result.author).toBe('did:plc:test123');
    expect(mockGetRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.pull',
      rkey: 'abc123',
    });
  });

  it('should throw for invalid AT-URI', async () => {
    await expect(getPull({ client: mockClient, pullUri: 'not-a-uri' })).rejects.toThrow(
      'Invalid pull request AT-URI'
    );
  });
});

describe('getPullState', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
    vi.mocked(getBacklinks).mockResolvedValue({ total: 0, records: [], cursor: null });
  });

  it('should return open when no state records exist', async () => {
    const state = await getPullState({ client: mockClient, pullUri: PULL_AT_URI });
    expect(state).toBe('open');
    expect(getBacklinks).toHaveBeenCalledWith(
      PULL_AT_URI,
      'sh.tangled.repo.pull.status',
      '.pull',
      100
    );
  });

  it('should return closed for closed status', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 1,
      records: [
        { did: 'did:plc:test123', collection: 'sh.tangled.repo.pull.status', rkey: 'rkey1' },
      ],
      cursor: null,
    });
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: { value: { status: 'sh.tangled.repo.pull.status.closed' }, uri: '', cid: '' },
    });
    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { getRecord: mockGetRecord } } },
    } as never);

    const state = await getPullState({ client: mockClient, pullUri: PULL_AT_URI });
    expect(state).toBe('closed');
  });

  it('should return merged for merged status', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 1,
      records: [
        { did: 'did:plc:test123', collection: 'sh.tangled.repo.pull.status', rkey: 'rkey1' },
      ],
      cursor: null,
    });
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: { value: { status: 'sh.tangled.repo.pull.status.merged' }, uri: '', cid: '' },
    });
    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { getRecord: mockGetRecord } } },
    } as never);

    const state = await getPullState({ client: mockClient, pullUri: PULL_AT_URI });
    expect(state).toBe('merged');
  });

  it('should use latest rkey when multiple state records exist', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 2,
      records: [
        { did: 'did:plc:test123', collection: 'sh.tangled.repo.pull.status', rkey: 'rkey2' },
        { did: 'did:plc:test123', collection: 'sh.tangled.repo.pull.status', rkey: 'rkey1' },
      ],
      cursor: null,
    });
    const mockGetRecord = vi
      .fn()
      .mockResolvedValueOnce({
        data: { value: { status: 'sh.tangled.repo.pull.status.closed' }, uri: '', cid: '' },
      })
      .mockResolvedValueOnce({
        data: { value: { status: 'sh.tangled.repo.pull.status.open' }, uri: '', cid: '' },
      });
    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { getRecord: mockGetRecord } } },
    } as never);

    // rkey2 > rkey1 alphabetically, so rkey2 (closed) should win
    const state = await getPullState({ client: mockClient, pullUri: PULL_AT_URI });
    expect(state).toBe('closed');
  });
});

describe('resolveSequentialPullNumber', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
    vi.mocked(getBacklinks).mockClear();
    vi.mocked(getBacklinks).mockResolvedValue({ total: 0, records: [], cursor: null });
  });

  it('should use fast path for #N displayId', async () => {
    const num = await resolveSequentialPullNumber('#3', PULL_AT_URI, mockClient, REPO_AT_URI);
    expect(num).toBe(3);
    expect(getBacklinks).not.toHaveBeenCalled();
  });

  it('should scan pulls when displayId is not #N', async () => {
    const pullUri1 = 'at://did:plc:test123/sh.tangled.repo.pull/rkey1';
    const pullUri2 = 'at://did:plc:test123/sh.tangled.repo.pull/rkey2';

    vi.mocked(getBacklinks).mockResolvedValue({
      total: 2,
      records: [
        { did: 'did:plc:test123', collection: 'sh.tangled.repo.pull', rkey: 'rkey1' },
        { did: 'did:plc:test123', collection: 'sh.tangled.repo.pull', rkey: 'rkey2' },
      ],
      cursor: null,
    });

    const mockGetRecord = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          value: {
            $type: 'sh.tangled.repo.pull',
            target: { repo: REPO_AT_URI, branch: 'main' },
            title: 'First',
            patchBlob: {},
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          uri: pullUri1,
          cid: 'cid1',
        },
      })
      .mockResolvedValueOnce({
        data: {
          value: {
            $type: 'sh.tangled.repo.pull',
            target: { repo: REPO_AT_URI, branch: 'main' },
            title: 'Second',
            patchBlob: {},
            createdAt: '2024-01-02T00:00:00.000Z',
          },
          uri: pullUri2,
          cid: 'cid2',
        },
      });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: { atproto: { repo: { getRecord: mockGetRecord } } },
    } as never);

    const num = await resolveSequentialPullNumber('rkey2', pullUri2, mockClient, REPO_AT_URI);
    expect(num).toBe(2);
  });
});
