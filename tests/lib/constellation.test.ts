import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBacklinks } from '../../src/lib/constellation.js';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getBacklinks', () => {
  it('should return records from constellation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 2,
        linking_records: [
          { did: 'did:plc:abc', collection: 'sh.tangled.repo.issue', rkey: 'rkey1' },
          { did: 'did:plc:def', collection: 'sh.tangled.repo.issue', rkey: 'rkey2' },
        ],
        cursor: null,
      }),
    });

    const result = await getBacklinks(
      'at://did:plc:owner/sh.tangled.repo/my-repo',
      'sh.tangled.repo.issue',
      '.repo'
    );

    expect(result.total).toBe(2);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual({
      did: 'did:plc:abc',
      collection: 'sh.tangled.repo.issue',
      rkey: 'rkey1',
    });
    expect(result.cursor).toBeNull();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://constellation.microcosm.blue/links?target=at%3A%2F%2Fdid%3Aplc%3Aowner%2Fsh.tangled.repo%2Fmy-repo&collection=sh.tangled.repo.issue&path=.repo&limit=100'
    );
  });

  it('should pass cursor and limit params', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, linking_records: [], cursor: null }),
    });

    await getBacklinks(
      'at://did:plc:owner/sh.tangled.repo/my-repo',
      'sh.tangled.repo.issue',
      '.repo',
      50,
      'abc123'
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=50');
    expect(calledUrl).toContain('cursor=abc123');
  });

  it('should return cursor for pagination', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 200,
        linking_records: [
          { did: 'did:plc:abc', collection: 'sh.tangled.repo.issue', rkey: 'rkey1' },
        ],
        cursor: 'nextpage',
      }),
    });

    const result = await getBacklinks(
      'at://did:plc:owner/sh.tangled.repo/my-repo',
      'sh.tangled.repo.issue',
      '.repo',
      1
    );

    expect(result.cursor).toBe('nextpage');
  });

  it('should throw on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(
      getBacklinks('at://did:plc:owner/sh.tangled.repo/my-repo', 'sh.tangled.repo.issue', '.repo')
    ).rejects.toThrow('Constellation API error: 503 Service Unavailable');
  });

  it('should return empty records when none found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, linking_records: [], cursor: null }),
    });

    const result = await getBacklinks(
      'at://did:plc:owner/sh.tangled.repo/my-repo',
      'sh.tangled.repo.issue',
      '.repo'
    );

    expect(result.total).toBe(0);
    expect(result.records).toEqual([]);
  });
});
