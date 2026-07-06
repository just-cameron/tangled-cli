import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import { parseAtUri, resolveHandleToDid, resolveRepoDid } from '../../src/utils/at-uri.js';

// Mock API client
const createMockClient = (): TangledApiClient => {
  return {
    getAgent: vi.fn(() => ({
      com: {
        atproto: {
          identity: {
            resolveHandle: vi.fn(),
          },
        },
      },
    })),
  } as unknown as TangledApiClient;
};

describe('parseAtUri', () => {
  it('should parse AT-URI with rkey', () => {
    const uri = 'at://did:plc:abc123/sh.tangled.repo.issue/xyz789';
    const result = parseAtUri(uri);

    expect(result).toEqual({
      did: 'did:plc:abc123',
      collection: 'sh.tangled.repo.issue',
      rkey: 'xyz789',
    });
  });

  it('should parse AT-URI without rkey', () => {
    const uri = 'at://did:plc:abc123/sh.tangled.repo';
    const result = parseAtUri(uri);

    expect(result).toEqual({
      did: 'did:plc:abc123',
      collection: 'sh.tangled.repo',
    });
  });

  it('should parse AT-URI with nested collection', () => {
    const uri = 'at://did:plc:abc123/sh.tangled.repo.issue.state/xyz';
    const result = parseAtUri(uri);

    expect(result).toEqual({
      did: 'did:plc:abc123',
      collection: 'sh.tangled.repo.issue.state',
      rkey: 'xyz',
    });
  });

  it('should return null for invalid URI', () => {
    expect(parseAtUri('not-a-uri')).toBeNull();
    expect(parseAtUri('http://example.com')).toBeNull();
    expect(parseAtUri('at://invalid-did/collection')).toBeNull();
    expect(parseAtUri('')).toBeNull();
  });

  it('should handle DIDs with various characters', () => {
    const uri = 'at://did:web:example.com/collection/rkey';
    const result = parseAtUri(uri);

    expect(result).toEqual({
      did: 'did:web:example.com',
      collection: 'collection',
      rkey: 'rkey',
    });
  });
});

describe('resolveHandleToDid', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should resolve handle to DID', async () => {
    const mockResolve = vi.fn().mockResolvedValue({
      data: { did: 'did:plc:abc123' },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          identity: {
            resolveHandle: mockResolve,
          },
        },
      },
    } as never);

    const result = await resolveHandleToDid('mark.bsky.social', mockClient);

    expect(result).toBe('did:plc:abc123');
    expect(mockResolve).toHaveBeenCalledWith({ handle: 'mark.bsky.social' });
  });

  it('should strip leading @ from handle', async () => {
    const mockResolve = vi.fn().mockResolvedValue({
      data: { did: 'did:plc:abc123' },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          identity: {
            resolveHandle: mockResolve,
          },
        },
      },
    } as never);

    await resolveHandleToDid('@mark.bsky.social', mockClient);

    expect(mockResolve).toHaveBeenCalledWith({ handle: 'mark.bsky.social' });
  });

  it('should throw error when handle not found', async () => {
    const mockResolve = vi.fn().mockResolvedValue({
      data: { did: null },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          identity: {
            resolveHandle: mockResolve,
          },
        },
      },
    } as never);

    await expect(resolveHandleToDid('nonexistent.bsky.social', mockClient)).rejects.toThrow(
      'No DID found for handle: nonexistent.bsky.social'
    );
  });

  it('should throw error on network failure', async () => {
    const mockResolve = vi.fn().mockRejectedValue(new Error('Network error'));

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          identity: {
            resolveHandle: mockResolve,
          },
        },
      },
    } as never);

    await expect(resolveHandleToDid('mark.bsky.social', mockClient)).rejects.toThrow(
      "Failed to resolve handle 'mark.bsky.social': Network error"
    );
  });
});

describe('resolveRepoDid', () => {
  let mockClient: TangledApiClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should return the DID directly for stable DID-only remotes, with no network call', async () => {
    const result = await resolveRepoDid(
      'did:plc:t53fxjacrmulx3e5d3sbdfui',
      'did:plc:t53fxjacrmulx3e5d3sbdfui',
      mockClient
    );

    expect(result).toBe('did:plc:t53fxjacrmulx3e5d3sbdfui');
    expect(mockClient.getAgent).not.toHaveBeenCalled();
  });

  it('should query the PDS and return the owner DID when no repoDid is assigned', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:abc123/sh.tangled.repo/3mef23waqwq22',
            value: { name: 'my-repo', description: 'Test repo' },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    const result = await resolveRepoDid('did:plc:abc123', 'my-repo', mockClient);

    expect(result).toBe('did:plc:abc123');
    expect(mockListRecords).toHaveBeenCalledWith({
      repo: 'did:plc:abc123',
      collection: 'sh.tangled.repo',
      limit: 100,
    });
  });

  it("should prefer the repo record's own repoDid when one is assigned", async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:abc123/sh.tangled.repo/3mef23waqwq22',
            value: { name: 'my-repo', repoDid: 'did:plc:stablerepoxyz' },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    const result = await resolveRepoDid('did:plc:abc123', 'my-repo', mockClient);

    expect(result).toBe('did:plc:stablerepoxyz');
  });

  it('should resolve handle then query for the repo record', async () => {
    const mockResolve = vi.fn().mockResolvedValue({
      data: { did: 'did:plc:abc123' },
    });

    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
            value: { name: 'my-repo' },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          identity: {
            resolveHandle: mockResolve,
          },
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    const result = await resolveRepoDid('mark.bsky.social', 'my-repo', mockClient);

    expect(result).toBe('did:plc:abc123');
    expect(mockResolve).toHaveBeenCalledWith({ handle: 'mark.bsky.social' });
    expect(mockListRecords).toHaveBeenCalledWith({
      repo: 'did:plc:abc123',
      collection: 'sh.tangled.repo',
      limit: 100,
    });
  });

  it('should find correct repo among multiple records', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:abc123/sh.tangled.repo/aaa111',
            value: { name: 'other-repo' },
          },
          {
            uri: 'at://did:plc:abc123/sh.tangled.repo/bbb222',
            value: { name: 'target-repo', repoDid: 'did:plc:targetrepodid' },
          },
          {
            uri: 'at://did:plc:abc123/sh.tangled.repo/ccc333',
            value: { name: 'another-repo' },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    const result = await resolveRepoDid('did:plc:abc123', 'target-repo', mockClient);

    expect(result).toBe('did:plc:targetrepodid');
  });

  it('should throw error when repository not found', async () => {
    const mockListRecords = vi.fn().mockResolvedValue({
      data: {
        records: [
          {
            uri: 'at://did:plc:abc123/sh.tangled.repo/xyz789',
            value: { name: 'different-repo' },
          },
        ],
      },
    });

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    await expect(resolveRepoDid('did:plc:abc123', 'nonexistent-repo', mockClient)).rejects.toThrow(
      "Repository 'nonexistent-repo' not found for did:plc:abc123"
    );
  });

  it('should throw error when handle resolution fails', async () => {
    const mockResolve = vi.fn().mockRejectedValue(new Error('Resolution failed'));

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          identity: {
            resolveHandle: mockResolve,
          },
        },
      },
    } as never);

    await expect(resolveRepoDid('mark.bsky.social', 'my-repo', mockClient)).rejects.toThrow(
      "Failed to resolve handle 'mark.bsky.social': Resolution failed"
    );
  });

  it('should throw error when listRecords fails', async () => {
    const mockListRecords = vi.fn().mockRejectedValue(new Error('API error'));

    vi.mocked(mockClient.getAgent).mockReturnValue({
      com: {
        atproto: {
          repo: {
            listRecords: mockListRecords,
          },
        },
      },
    } as never);

    await expect(resolveRepoDid('did:plc:abc123', 'my-repo', mockClient)).rejects.toThrow(
      'Failed to resolve repository DID: API error'
    );
  });
});
