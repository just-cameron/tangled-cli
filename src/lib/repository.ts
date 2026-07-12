import { parseAtUri, resolveHandleToDid, resolveRepoDid } from '../utils/at-uri.js';
import type { TangledApiClient } from './api-client.js';
import { getBacklinks } from './constellation.js';
import type { RepositoryContext } from './context.js';
import { getRecordFromDid, listAllRecordsFromDid } from './public-records.js';

export interface RepositoryRecordValue {
  $type?: 'sh.tangled.repo';
  name?: string;
  knot: string;
  spindle?: string;
  description?: string;
  website?: string;
  topics?: string[];
  source?: string;
  labels?: string[];
  repoDid?: string;
  createdAt: string;
  [key: string]: unknown;
}

export async function resolveRepositoryDid(
  context: RepositoryContext,
  client: TangledApiClient
): Promise<string> {
  if (context.repoDid) return context.repoDid;
  if (context.repoAtUri) {
    const parsed = parseAtUri(context.repoAtUri);
    if (!parsed?.rkey) throw new Error(`Invalid repository AT-URI: ${context.repoAtUri}`);
    const record = await getRecordFromDid(client, parsed.did, 'sh.tangled.repo', parsed.rkey);
    return (record.data.value as RepositoryRecordValue).repoDid ?? parsed.did;
  }
  return resolveRepoDid(context.owner, context.name, client);
}

export interface ResolvedRepository {
  owner: string;
  ownerDid?: string;
  name?: string;
  repoDid: string;
  recordUri?: string;
  recordCid?: string;
  knot?: string;
  spindle?: string;
  publicUrl?: string;
  selectionSource?: RepositoryContext['selectionSource'];
  record?: RepositoryRecordValue;
}

function recordName(uri: string, value: RepositoryRecordValue): string {
  return value.name ?? uri.split('/').pop() ?? '<unknown>';
}

function fromRecord(
  context: RepositoryContext,
  ownerDid: string,
  record: { uri: string; cid?: string; value: unknown }
): ResolvedRepository {
  const value = record.value as RepositoryRecordValue;
  const name = recordName(record.uri, value);
  return {
    owner: context.owner,
    ownerDid,
    name,
    repoDid: value.repoDid ?? ownerDid,
    recordUri: record.uri,
    recordCid: record.cid,
    knot: value.knot,
    spindle: value.spindle,
    publicUrl: context.publicUrl ?? `https://tangled.org/${context.owner}/${name}`,
    selectionSource: context.selectionSource,
    record: value,
  };
}

async function repositoryRecordByUri(
  client: TangledApiClient,
  uri: string
): Promise<{ uri: string; cid?: string; value: unknown }> {
  const parsed = parseAtUri(uri);
  if (!parsed?.rkey || parsed.collection !== 'sh.tangled.repo') {
    throw new Error(`Invalid repository record AT-URI: ${uri}`);
  }
  return (await getRecordFromDid(client, parsed.did, parsed.collection, parsed.rkey)).data;
}

async function repositoryRecordByDid(
  client: TangledApiClient,
  repoDid: string
): Promise<{ uri: string; cid?: string; value: unknown } | undefined> {
  let cursor: string | undefined;
  do {
    const result = await getBacklinks(repoDid, 'sh.tangled.repo', '.repoDid', 100, cursor);
    for (const ref of result.records) {
      const record = await getRecordFromDid(client, ref.did, ref.collection, ref.rkey);
      return record.data;
    }
    cursor = result.cursor ?? undefined;
  } while (cursor);
  return undefined;
}

/** Resolve a repository selector to stable identity plus its live metadata record. */
export async function resolveRepository(
  context: RepositoryContext,
  client: TangledApiClient
): Promise<ResolvedRepository> {
  if (context.repoAtUri) {
    const parsed = parseAtUri(context.repoAtUri);
    if (!parsed) throw new Error(`Invalid repository AT-URI: ${context.repoAtUri}`);
    return fromRecord(context, parsed.did, await repositoryRecordByUri(client, context.repoAtUri));
  }

  if (context.repoDid && context.owner === context.name) {
    const record = await repositoryRecordByDid(client, context.repoDid);
    if (record) {
      const parsed = parseAtUri(record.uri);
      return fromRecord(context, parsed?.did ?? context.owner, record);
    }
    return {
      owner: context.owner,
      repoDid: context.repoDid,
      selectionSource: context.selectionSource,
    };
  }

  const ownerDid = context.owner.startsWith('did:')
    ? context.owner
    : await resolveHandleToDid(context.owner, client);
  const records = await listAllRecordsFromDid(client, ownerDid, 'sh.tangled.repo');
  const record = records.find((candidate) => {
    const value = candidate.value as RepositoryRecordValue;
    return value.name === context.name || candidate.uri.split('/').pop() === context.name;
  });
  if (!record) throw new Error(`Repository '${context.name}' not found for ${context.owner}`);
  return fromRecord(context, ownerDid, record);
}

export function serviceUrl(host: string): string {
  const value = host.trim().replace(/\/$/, '');
  if (!value) throw new Error('Service host cannot be empty');
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}
