import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import {
  cancelPipeline,
  decodePipelineLogFrame,
  pipelineId,
  queryAllPipelines,
  queryPipelines,
  triggerPipeline,
} from '../../src/lib/ci-api.js';

function cbor(value: unknown): number[] {
  if (typeof value === 'number' && Number.isInteger(value)) {
    if (value >= 0 && value < 24) return [value];
    if (value < 0 && value >= -24) return [0x20 + (-1 - value)];
  }
  if (typeof value === 'string') {
    const bytes = [...new TextEncoder().encode(value)];
    if (bytes.length >= 24) throw new Error('test encoder only supports short strings');
    return [0x60 + bytes.length, ...bytes];
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value);
    if (entries.length >= 24) throw new Error('test encoder only supports short maps');
    return [
      0xa0 + entries.length,
      ...entries.flatMap(([key, item]) => [...cbor(key), ...cbor(item)]),
    ];
  }
  throw new Error(`Unsupported test CBOR value: ${String(value)}`);
}

describe('CI API', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('queries the canonical Spindle XRPC namespace with pagination parameters', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ total: 0, pipelines: [], cursor: 'next' }), {
        headers: { 'content-type': 'application/json' },
      })
    );
    await queryPipelines({
      spindle: 'https://spindle.example',
      repoDid: 'did:plc:repo',
      commits: ['abc'],
      limit: 20,
      cursor: 'page-2',
    });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/xrpc/sh.tangled.ci.queryPipelines');
    expect(url.searchParams.get('repo')).toBe('did:plc:repo');
    expect(url.searchParams.get('commits')).toBe('abc');
    expect(url.searchParams.get('limit')).toBe('20');
    expect(url.searchParams.get('cursor')).toBe('page-2');
  });

  it('follows every pipeline page', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total: 2,
            cursor: 'next',
            pipelines: [{ id: 'aaa', commit: '1', trigger: {}, workflows: [] }],
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total: 2,
            pipelines: [{ id: 'bbb', commit: '2', trigger: {}, workflows: [] }],
          })
        )
      );
    const pipelines = await queryAllPipelines({
      spindle: 'https://spindle.example',
      repoDid: 'did:plc:repo',
    });
    expect(pipelines.map(({ id }) => id)).toEqual(['aaa', 'bbb']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('mints a method-bound service token for each CI mutation', async () => {
    const getServiceAuth = vi.fn().mockResolvedValue({ data: { token: 'secret-service-token' } });
    const client = {
      getAgent: vi.fn().mockResolvedValue({ com: { atproto: { server: { getServiceAuth } } } }),
    } as unknown as TangledApiClient;
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ pipeline: 'abc' })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await triggerPipeline({
      client,
      spindle: 'https://spindle.example',
      repoDid: 'did:plc:repo',
      trigger: { $type: 'sh.tangled.ci.trigger#manual', sha: 'deadbeef' },
    });
    await cancelPipeline({
      client,
      spindle: 'https://spindle.example',
      repoDid: 'did:plc:repo',
      pipeline: 'abc',
    });

    expect(getServiceAuth).toHaveBeenNthCalledWith(1, {
      aud: 'did:web:spindle.example',
      lxm: 'sh.tangled.ci.triggerPipeline',
    });
    expect(getServiceAuth).toHaveBeenNthCalledWith(2, {
      aud: 'did:web:spindle.example',
      lxm: 'sh.tangled.ci.cancelPipeline',
    });
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe('Bearer secret-service-token');
  });

  it('preserves and did:web-encodes a custom Spindle port in the service audience', async () => {
    const getServiceAuth = vi.fn().mockResolvedValue({ data: { token: 'service-token' } });
    const client = {
      getAgent: vi.fn().mockResolvedValue({ com: { atproto: { server: { getServiceAuth } } } }),
    } as unknown as TangledApiClient;
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ pipeline: 'abc' })));

    await triggerPipeline({
      client,
      spindle: 'http://localhost:6555',
      repoDid: 'did:plc:repo',
      trigger: { $type: 'sh.tangled.ci.trigger#manual', sha: 'deadbeef' },
    });

    expect(getServiceAuth).toHaveBeenCalledWith({
      aud: 'did:web:localhost%3A6555',
      lxm: 'sh.tangled.ci.triggerPipeline',
    });
  });

  it('decodes concatenated CBOR event header and data payload frames', () => {
    const bytes = new Uint8Array([
      ...cbor({ op: 1, t: '#data' }),
      ...cbor({
        time: 'now',
        workflow: 'check',
        step: 2,
        content: 'ok',
        stream: 'stdout',
      }),
    ]);
    expect(decodePipelineLogFrame(bytes)).toEqual({
      type: 'data',
      time: 'now',
      workflow: 'check',
      step: 2,
      content: 'ok',
      stream: 'stdout',
    });
  });

  it('normalizes pipeline URLs and rejects malformed identifiers', () => {
    expect(pipelineId('https://spindle.example/pipelines/abc234')).toBe('abc234');
    expect(() => pipelineId('not valid!')).toThrow('Invalid pipeline identifier');
  });
});
