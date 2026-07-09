import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import { getBacklinks } from '../../src/lib/constellation.js';
import {
  closeIssue,
  createIssue,
  getCompleteIssueData,
  getIssue,
  getIssueState,
  listIssues,
  reopenIssue,
  resolveSequentialNumber,
  updateIssue,
} from '../../src/lib/issues-api.js';

vi.mock('../../src/lib/constellation.js');

// Mock API client factory
const createMockClient = (authenticated = true): TangledApiClient => {
  const mockAgent = {
    com: {
      atproto: {
        repo: {
          createRecord: vi.fn(),
          listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
          getRecord: vi.fn(),
          putRecord: vi.fn(),
          deleteRecord: vi.fn(),
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

describe('createIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should create an issue with all fields', async () => {
    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/abc123',
        cid: 'cid123',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    const result = await createIssue({
      client: mockClient,
      repoDid: 'did:plc:owner',
      title: 'Bug: Login fails',
      body: 'Detailed description of the bug',
    });

    expect(result).toMatchObject({
      repo: 'did:plc:owner',
      title: 'Bug: Login fails',
      body: 'Detailed description of the bug',
      uri: 'at://did:plc:test123/sh.tangled.repo.issue/abc123',
      cid: 'cid123',
      author: 'did:plc:test123',
    });

    expect(mockCreateRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue',
      record: expect.objectContaining({
        $type: 'sh.tangled.repo.issue',
        repo: 'did:plc:owner',
        title: 'Bug: Login fails',
        body: 'Detailed description of the bug',
        createdAt: expect.any(String),
      }),
    });
  });

  it('should create an issue without body', async () => {
    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/abc123',
        cid: 'cid123',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    const result = await createIssue({
      client: mockClient,
      repoDid: 'did:plc:owner',
      title: 'Simple issue',
    });

    expect(result.body).toBeUndefined();
    expect(mockCreateRecord).toHaveBeenCalled();
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      createIssue({
        client: mockClient,
        repoDid: 'did:plc:owner',
        title: 'Test',
      })
    ).rejects.toThrow('Must be authenticated');
  });

  it('should throw error on API failure', async () => {
    const mockCreateRecord = vi.fn().mockRejectedValue(new Error('API error'));

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    await expect(
      createIssue({
        client: mockClient,
        repoDid: 'did:plc:owner',
        title: 'Test',
      })
    ).rejects.toThrow('Failed to create issue: API error');
  });
});

describe('listIssues', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should list issues from multiple PDSs via constellation', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 2,
      records: [
        { did: 'did:plc:owner', collection: 'sh.tangled.repo.issue', rkey: 'issue1' },
        { did: 'did:plc:collab', collection: 'sh.tangled.repo.issue', rkey: 'issue2' },
      ],
      cursor: null,
    });

    const mockGetRecord = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
          cid: 'cid1',
          value: {
            $type: 'sh.tangled.repo.issue',
            repo: 'did:plc:owner',
            title: 'Issue 1',
            body: 'Description 1',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          uri: 'at://did:plc:collab/sh.tangled.repo.issue/issue2',
          cid: 'cid2',
          value: {
            $type: 'sh.tangled.repo.issue',
            repo: 'did:plc:owner',
            title: 'Issue 2',
            createdAt: '2024-01-02T00:00:00.000Z',
          },
        },
      });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
          },
        },
      },
    } as never);

    const result = await listIssues({
      client: mockClient,
      repoDid: 'did:plc:owner',
    });

    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]).toMatchObject({
      title: 'Issue 1',
      body: 'Description 1',
      uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      author: 'did:plc:owner',
    });
    expect(result.issues[1]).toMatchObject({
      title: 'Issue 2',
      uri: 'at://did:plc:collab/sh.tangled.repo.issue/issue2',
      author: 'did:plc:collab',
    });

    expect(getBacklinks).toHaveBeenCalledWith(
      'did:plc:owner',
      'sh.tangled.repo.issue',
      '.repo',
      50,
      undefined
    );
  });

  it('should return empty array when no issues found', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({ total: 0, records: [], cursor: null });

    const result = await listIssues({
      client: mockClient,
      repoDid: 'did:plc:owner',
    });

    expect(result.issues).toEqual([]);
  });

  it('should forward cursor from constellation', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({ total: 100, records: [], cursor: 'nextpage' });

    const result = await listIssues({
      client: mockClient,
      repoDid: 'did:plc:owner',
    });

    expect(result.cursor).toBe('nextpage');
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      listIssues({
        client: mockClient,
        repoDid: 'did:plc:owner',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('getIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should get a specific issue', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          $type: 'sh.tangled.repo.issue',
          repo: 'did:plc:owner',
          title: 'Test Issue',
          body: 'Test Description',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: mockGetRecord,
          },
        },
      },
    } as never);

    const result = await getIssue({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toMatchObject({
      title: 'Test Issue',
      body: 'Test Description',
      uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      cid: 'cid1',
    });

    expect(mockGetRecord).toHaveBeenCalledWith({
      repo: 'did:plc:owner',
      collection: 'sh.tangled.repo.issue',
      rkey: 'issue1',
    });
  });

  it('should throw error when issue not found', async () => {
    const mockGetRecord = vi.fn().mockRejectedValue(new Error('Record not found'));

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: mockGetRecord,
          },
        },
      },
    } as never);

    await expect(
      getIssue({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/nonexistent',
      })
    ).rejects.toThrow('Issue not found');
  });

  it('should throw error for invalid issue URI', async () => {
    await expect(
      getIssue({
        client: mockClient,
        issueUri: 'invalid-uri',
      })
    ).rejects.toThrow('Invalid issue AT-URI');
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      getIssue({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('updateIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should update issue title', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
        cid: 'old-cid',
        value: {
          repo: 'did:plc:test123',
          title: 'Old Title',
          body: 'Original body',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockPutRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
        cid: 'new-cid',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: mockGetRecord,
            putRecord: mockPutRecord,
          },
        },
      },
    } as never);

    const result = await updateIssue({
      client: mockClient,
      issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
      title: 'New Title',
    });

    expect(result.title).toBe('New Title');
    expect(result.body).toBe('Original body'); // Body unchanged

    expect(mockPutRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue',
      rkey: 'issue1',
      record: expect.objectContaining({
        title: 'New Title',
        body: 'Original body',
      }),
      swapRecord: 'old-cid',
    });
  });

  it('should update issue body', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
        cid: 'old-cid',
        value: {
          repo: 'did:plc:test123',
          title: 'Title',
          body: 'Old body',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockPutRecord = vi.fn().mockResolvedValue({
      data: {
        cid: 'new-cid',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: mockGetRecord,
            putRecord: mockPutRecord,
          },
        },
      },
    } as never);

    const result = await updateIssue({
      client: mockClient,
      issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
      body: 'New body',
    });

    expect(result.title).toBe('Title'); // Title unchanged
    expect(result.body).toBe('New body');
  });

  it('should throw error when updating issue not owned by user', async () => {
    await expect(
      updateIssue({
        client: mockClient,
        issueUri: 'at://did:plc:someone-else/sh.tangled.repo.issue/issue1',
        title: 'New Title',
      })
    ).rejects.toThrow('Cannot update issue: you are not the author');
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      updateIssue({
        client: mockClient,
        issueUri: 'at://did:plc:test123/sh.tangled.repo.issue/issue1',
        title: 'New Title',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('closeIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should close an issue', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          repo: 'did:plc:owner',
          title: 'Test Issue',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue.state/state1',
        cid: 'state-cid',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: mockGetRecord,
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    await closeIssue({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(mockCreateRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue.state',
      record: {
        $type: 'sh.tangled.repo.issue.state',
        issue: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        state: 'sh.tangled.repo.issue.state.closed',
      },
    });
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      closeIssue({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('getIssueState', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should return open when no state records exist', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({ total: 0, records: [], cursor: null });

    const result = await getIssueState({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toBe('open');
    expect(getBacklinks).toHaveBeenCalledWith(
      'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      'sh.tangled.repo.issue.state',
      '.issue',
      100
    );
  });

  it('should return closed when latest state record is closed', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 1,
      records: [
        { did: 'did:plc:owner', collection: 'sh.tangled.repo.issue.state', rkey: 'state1' },
      ],
      cursor: null,
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: vi.fn().mockResolvedValue({
              data: {
                uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/state1',
                cid: 'cid1',
                value: { state: 'sh.tangled.repo.issue.state.closed' },
              },
            }),
          },
        },
      },
    } as never);

    const result = await getIssueState({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toBe('closed');
  });

  it('should return open when latest state record (by rkey) is open', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 2,
      records: [
        { did: 'did:plc:owner', collection: 'sh.tangled.repo.issue.state', rkey: 'aaa111' },
        { did: 'did:plc:owner', collection: 'sh.tangled.repo.issue.state', rkey: 'bbb222' },
      ],
      cursor: null,
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: vi
              .fn()
              .mockResolvedValueOnce({
                data: {
                  uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/aaa111',
                  cid: 'cid1',
                  value: { state: 'sh.tangled.repo.issue.state.closed' },
                },
              })
              .mockResolvedValueOnce({
                data: {
                  uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/bbb222',
                  cid: 'cid2',
                  value: { state: 'sh.tangled.repo.issue.state.open' },
                },
              }),
          },
        },
      },
    } as never);

    const result = await getIssueState({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toBe('open');
  });

  it('should use rkey sort order to determine most recent state across PDSs', async () => {
    // Collaborator's close (rkey 'ccc333') is more recent than owner's open (rkey 'aaa111')
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 2,
      records: [
        { did: 'did:plc:owner', collection: 'sh.tangled.repo.issue.state', rkey: 'aaa111' },
        { did: 'did:plc:collab', collection: 'sh.tangled.repo.issue.state', rkey: 'ccc333' },
      ],
      cursor: null,
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: vi
              .fn()
              .mockResolvedValueOnce({
                data: {
                  uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/aaa111',
                  cid: 'cid1',
                  value: { state: 'sh.tangled.repo.issue.state.open' },
                },
              })
              .mockResolvedValueOnce({
                data: {
                  uri: 'at://did:plc:collab/sh.tangled.repo.issue.state/ccc333',
                  cid: 'cid2',
                  value: { state: 'sh.tangled.repo.issue.state.closed' },
                },
              }),
          },
        },
      },
    } as never);

    const result = await getIssueState({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(result).toBe('closed');
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      getIssueState({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('reopenIssue', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should reopen a closed issue', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          repo: 'did:plc:owner',
          title: 'Test Issue',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    const mockCreateRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/sh.tangled.repo.issue.state/state1',
        cid: 'state-cid',
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
            getRecord: mockGetRecord,
            createRecord: mockCreateRecord,
          },
        },
      },
    } as never);

    await reopenIssue({
      client: mockClient,
      issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
    });

    expect(mockCreateRecord).toHaveBeenCalledWith({
      repo: 'did:plc:test123',
      collection: 'sh.tangled.repo.issue.state',
      record: {
        $type: 'sh.tangled.repo.issue.state',
        issue: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        state: 'sh.tangled.repo.issue.state.open',
      },
    });
  });

  it('should throw error when not authenticated', async () => {
    mockClient = createMockClient(false);

    await expect(
      reopenIssue({
        client: mockClient,
        issueUri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      })
    ).rejects.toThrow('Must be authenticated');
  });
});

describe('resolveSequentialNumber', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient(true);
  });

  it('should return number directly for #N displayId without an API call (fast path)', async () => {
    const result = await resolveSequentialNumber(
      '#3',
      'at://did:plc:owner/sh.tangled.repo.issue/issue3',
      mockClient,
      'did:plc:owner'
    );
    expect(result).toBe(3);
  });

  it('should scan issue list and return 1-based position for rkey displayId', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 2,
      records: [
        { did: 'did:plc:owner', collection: 'sh.tangled.repo.issue', rkey: 'issue-a' },
        { did: 'did:plc:owner', collection: 'sh.tangled.repo.issue', rkey: 'issue-b' },
      ],
      cursor: null,
    });

    const mockGetRecord = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue-a',
          cid: 'cid1',
          value: {
            $type: 'sh.tangled.repo.issue',
            repo: 'did:plc:owner',
            title: 'First',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue-b',
          cid: 'cid2',
          value: {
            $type: 'sh.tangled.repo.issue',
            repo: 'did:plc:owner',
            title: 'Second',
            createdAt: '2024-01-02T00:00:00.000Z',
          },
        },
      });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
          },
        },
      },
    } as never);

    const result = await resolveSequentialNumber(
      'issue-b',
      'at://did:plc:owner/sh.tangled.repo.issue/issue-b',
      mockClient,
      'did:plc:owner'
    );
    expect(result).toBe(2);
  });

  it('should return undefined when issue URI not found in list', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 1,
      records: [{ did: 'did:plc:owner', collection: 'sh.tangled.repo.issue', rkey: 'issue-a' }],
      cursor: null,
    });

    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue-a',
        cid: 'cid1',
        value: {
          $type: 'sh.tangled.repo.issue',
          repo: 'did:plc:owner',
          title: 'First',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
          },
        },
      },
    } as never);

    const result = await resolveSequentialNumber(
      'nonexistent',
      'at://did:plc:owner/sh.tangled.repo.issue/nonexistent',
      mockClient,
      'did:plc:owner'
    );
    expect(result).toBeUndefined();
  });
});

describe('getCompleteIssueData', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient(true);
  });

  it('should return all fields including fetched state', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({
      total: 1,
      records: [{ did: 'did:plc:owner', collection: 'sh.tangled.repo.issue.state', rkey: 's1' }],
      cursor: null,
    });

    const mockGetRecord = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
          cid: 'cid1',
          value: {
            $type: 'sh.tangled.repo.issue',
            repo: 'did:plc:owner',
            title: 'Test Issue',
            body: 'Test body',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          uri: 'at://did:plc:owner/sh.tangled.repo.issue.state/s1',
          cid: 'scid1',
          value: { state: 'sh.tangled.repo.issue.state.closed' },
        },
      });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
          },
        },
      },
    } as never);

    const result = await getCompleteIssueData(
      mockClient,
      'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      '#1', // fast-path for number
      'did:plc:owner'
    );

    expect(result).toEqual({
      number: 1,
      title: 'Test Issue',
      body: 'Test body',
      state: 'closed',
      author: 'did:plc:owner',
      createdAt: '2024-01-01T00:00:00.000Z',
      uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      cid: 'cid1',
    });
  });

  it('should use stateOverride and skip the getIssueState network call', async () => {
    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          $type: 'sh.tangled.repo.issue',
          repo: 'did:plc:owner',
          title: 'Test Issue',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
          },
        },
      },
    } as never);

    const result = await getCompleteIssueData(
      mockClient,
      'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      '#2',
      'did:plc:owner',
      'closed'
    );

    expect(result.number).toBe(2);
    expect(result.state).toBe('closed');
    expect(getBacklinks).not.toHaveBeenCalled();
  });

  it('should return undefined body and default open state when issue has no body or state records', async () => {
    vi.mocked(getBacklinks).mockResolvedValue({ total: 0, records: [], cursor: null });

    const mockGetRecord = vi.fn().mockResolvedValue({
      data: {
        uri: 'at://did:plc:owner/sh.tangled.repo.issue/issue1',
        cid: 'cid1',
        value: {
          $type: 'sh.tangled.repo.issue',
          repo: 'did:plc:owner',
          title: 'No body issue',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            getRecord: mockGetRecord,
            listRecords: vi.fn().mockResolvedValue({ data: { records: [] } }),
          },
        },
      },
    } as never);

    const result = await getCompleteIssueData(
      mockClient,
      'at://did:plc:owner/sh.tangled.repo.issue/issue1',
      '#1',
      'did:plc:owner'
    );

    expect(result.body).toBeUndefined();
    expect(result.state).toBe('open');
  });
});
