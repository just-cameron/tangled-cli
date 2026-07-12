import type { TangledApiClient } from './api-client.js';
import { serviceUrl } from './repository.js';

export type WorkflowStatus = 'pending' | 'running' | 'failed' | 'timeout' | 'cancelled' | 'success';

export interface PipelineWorkflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export interface Pipeline {
  id: string;
  repo?: string;
  trigger: Record<string, unknown>;
  commit: string;
  sourceRepo?: string;
  createdAt?: string;
  workflows: PipelineWorkflow[];
}

export interface PipelinePage {
  total: number;
  cursor?: string;
  pipelines: Pipeline[];
}

export interface LogEvent {
  type: 'control' | 'data';
  time: string;
  workflow: string;
  step: number;
  content: string;
  command?: string;
  status?: 'start' | 'end';
  kind?: 'system' | 'user';
  stream?: 'stdout' | 'stderr';
}

export interface ManualTrigger {
  $type: 'sh.tangled.ci.trigger#manual';
  sha: string;
  ref?: string;
  sourceRepo?: string;
  inputs?: Array<{ key: string; value: string }>;
}

function xrpcUrl(spindle: string, method: string, params?: URLSearchParams): string {
  const url = new URL(`/xrpc/${method}`, serviceUrl(spindle));
  if (params) url.search = params.toString();
  return url.toString();
}

async function responseError(response: Response): Promise<Error> {
  let detail = `${response.status} ${response.statusText}`;
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    detail = [body.error, body.message].filter(Boolean).join(': ') || detail;
  } catch {
    // Keep the HTTP status when the server did not return an XRPC JSON error.
  }
  return new Error(detail);
}

async function query<T>(spindle: string, method: string, params: URLSearchParams): Promise<T> {
  const response = await fetch(xrpcUrl(spindle, method, params));
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as T;
}

function spindleAudience(spindle: string): string {
  const url = new URL(serviceUrl(spindle));
  // Tangled's service-auth verifier derives did:web from the complete service
  // authority. Preserve an explicit port and encode its colon as required by
  // did:web (for example, localhost:6555 -> did:web:localhost%3A6555).
  return `did:web:${url.host.replaceAll(':', '%3A')}`;
}

async function serviceToken(
  client: TangledApiClient,
  spindle: string,
  method: string
): Promise<string> {
  const agent = await client.getAgent();
  const response = await agent.com.atproto.server.getServiceAuth({
    aud: spindleAudience(spindle),
    lxm: method,
  });
  return response.data.token;
}

async function procedure<T>(
  client: TangledApiClient,
  spindle: string,
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const token = await serviceToken(client, spindle, method);
  const response = await fetch(xrpcUrl(spindle, method), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await responseError(response);
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function pipelineId(input: string): string {
  const normalized = input.trim().replace(/\/$/, '');
  const id = normalized.split('/').at(-1);
  if (!id || !/^[2-7a-z]+$/i.test(id)) {
    throw new Error(`Invalid pipeline identifier: ${input}`);
  }
  return id;
}

export async function queryPipelines(options: {
  spindle: string;
  repoDid: string;
  commits?: string[];
  limit?: number;
  cursor?: string;
}): Promise<PipelinePage> {
  const params = new URLSearchParams({ repo: options.repoDid });
  for (const commit of options.commits ?? []) params.append('commits', commit);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);
  return query(options.spindle, 'sh.tangled.ci.queryPipelines', params);
}

export async function queryAllPipelines(options: {
  spindle: string;
  repoDid: string;
  commits?: string[];
}): Promise<Pipeline[]> {
  const pipelines: Pipeline[] = [];
  let cursor: string | undefined;
  do {
    const page = await queryPipelines({ ...options, limit: 250, cursor });
    pipelines.push(...page.pipelines);
    cursor = page.cursor;
  } while (cursor);
  return pipelines;
}

export function getPipeline(spindle: string, input: string): Promise<Pipeline> {
  return query(
    spindle,
    'sh.tangled.ci.getPipeline',
    new URLSearchParams({ pipeline: pipelineId(input) })
  );
}

export async function triggerPipeline(options: {
  client: TangledApiClient;
  spindle: string;
  repoDid: string;
  trigger: ManualTrigger;
  workflows?: string[];
}): Promise<{ pipeline: string }> {
  return procedure(options.client, options.spindle, 'sh.tangled.ci.triggerPipeline', {
    repo: options.repoDid,
    trigger: options.trigger,
    workflows: options.workflows,
  });
}

export async function cancelPipeline(options: {
  client: TangledApiClient;
  spindle: string;
  repoDid: string;
  pipeline: string;
  workflows?: string[];
}): Promise<void> {
  await procedure<void>(options.client, options.spindle, 'sh.tangled.ci.cancelPipeline', {
    repo: options.repoDid,
    pipeline: pipelineId(options.pipeline),
    workflows: options.workflows,
  });
}

interface DecodedCbor {
  value: unknown;
  offset: number;
}

function decodeCbor(data: Uint8Array, start = 0): DecodedCbor {
  let offset = start;
  const first = data[offset++];
  if (first === undefined) throw new Error('Unexpected end of CBOR frame');
  const major = first >> 5;
  const additional = first & 31;
  const length = (): number => {
    if (additional < 24) return additional;
    const bytes = additional === 24 ? 1 : additional === 25 ? 2 : additional === 26 ? 4 : 8;
    if (additional !== 24 && additional !== 25 && additional !== 26 && additional !== 27) {
      throw new Error('Indefinite CBOR values are not supported');
    }
    let value = 0;
    for (let i = 0; i < bytes; i += 1) value = value * 256 + (data[offset++] ?? 0);
    return value;
  };

  if (major === 0) return { value: length(), offset };
  if (major === 1) return { value: -1 - length(), offset };
  if (major === 2 || major === 3) {
    const size = length();
    const bytes = data.slice(offset, offset + size);
    offset += size;
    return { value: major === 2 ? bytes : new TextDecoder().decode(bytes), offset };
  }
  if (major === 4) {
    const size = length();
    const value: unknown[] = [];
    for (let i = 0; i < size; i += 1) {
      const item = decodeCbor(data, offset);
      value.push(item.value);
      offset = item.offset;
    }
    return { value, offset };
  }
  if (major === 5) {
    const size = length();
    const value: Record<string, unknown> = {};
    for (let i = 0; i < size; i += 1) {
      const key = decodeCbor(data, offset);
      const item = decodeCbor(data, key.offset);
      value[String(key.value)] = item.value;
      offset = item.offset;
    }
    return { value, offset };
  }
  if (major === 6) {
    length();
    return decodeCbor(data, offset);
  }
  if (major === 7) {
    if (additional === 20) return { value: false, offset };
    if (additional === 21) return { value: true, offset };
    if (additional === 22 || additional === 23) return { value: null, offset };
  }
  throw new Error(`Unsupported CBOR value (major ${major}, additional ${additional})`);
}

export function decodePipelineLogFrame(bytes: Uint8Array): LogEvent {
  const header = decodeCbor(bytes);
  const body = decodeCbor(bytes, header.offset);
  const head = header.value as { op?: number; t?: string };
  if (head.op === -1) {
    const error = body.value as { error?: string; message?: string };
    throw new Error([error.error, error.message].filter(Boolean).join(': ') || 'Log stream error');
  }
  const type = head.t === '#control' ? 'control' : head.t === '#data' ? 'data' : undefined;
  if (!type) throw new Error(`Unknown log event type: ${String(head.t)}`);
  return { type, ...(body.value as Omit<LogEvent, 'type'>) };
}

export async function subscribePipelineLogs(options: {
  spindle: string;
  pipeline: string;
  workflows?: string[];
  signal?: AbortSignal;
  onEvent: (event: LogEvent) => void;
}): Promise<void> {
  const params = new URLSearchParams({ pipeline: pipelineId(options.pipeline) });
  for (const workflow of options.workflows ?? []) params.append('workflows', workflow);
  const url = new URL(xrpcUrl(options.spindle, 'sh.tangled.ci.subscribePipelineLogs', params));
  url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';

  await new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    const abort = (): void => socket.close(1000, 'aborted');
    options.signal?.addEventListener('abort', abort, { once: true });
    socket.onmessage = (message) => {
      try {
        const bytes =
          message.data instanceof ArrayBuffer
            ? new Uint8Array(message.data)
            : new Uint8Array(message.data as ArrayBufferLike);
        options.onEvent(decodePipelineLogFrame(bytes));
      } catch (error) {
        socket.close(1002, 'invalid event');
        reject(error);
      }
    };
    socket.onerror = () => reject(new Error('Pipeline log WebSocket failed'));
    socket.onclose = (event) => {
      options.signal?.removeEventListener('abort', abort);
      if (event.code === 1000 || event.code === 1005) resolve();
      else reject(new Error(`Pipeline log stream closed (${event.code} ${event.reason})`));
    };
  });
}

export function aggregatePipelineStatus(pipeline: Pipeline): WorkflowStatus {
  const statuses = pipeline.workflows.map((workflow) => workflow.status);
  if (statuses.includes('running')) return 'running';
  if (statuses.includes('pending')) return 'pending';
  if (statuses.includes('failed')) return 'failed';
  if (statuses.includes('timeout')) return 'timeout';
  if (statuses.includes('cancelled')) return 'cancelled';
  return 'success';
}
