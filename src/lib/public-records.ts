import { AtpAgent } from '@atproto/api';
import type { TangledApiClient } from './api-client.js';

interface DidDocument {
  service?: Array<{
    id?: string;
    type?: string;
    serviceEndpoint?: string | { uri?: string };
  }>;
}

const endpointCache = new Map<string, string>();

function didDocumentUrl(did: string): string {
  if (did.startsWith('did:plc:')) {
    return `https://plc.directory/${encodeURIComponent(did)}`;
  }
  if (did.startsWith('did:web:')) {
    const parts = did.slice('did:web:'.length).split(':').map(decodeURIComponent);
    const host = parts.shift();
    if (!host) throw new Error(`Invalid did:web identifier: ${did}`);
    const path = parts.length > 0 ? `/${parts.join('/')}/did.json` : '/.well-known/did.json';
    return `https://${host}${path}`;
  }
  throw new Error(`Unsupported DID method for PDS discovery: ${did}`);
}

/** Resolve the authoritative PDS service for a DID without relying on a logged-in PDS proxy. */
export async function resolvePdsEndpoint(did: string): Promise<string> {
  const cached = endpointCache.get(did);
  if (cached) return cached;

  const response = await fetch(didDocumentUrl(did));
  if (!response.ok) {
    throw new Error(
      `DID document lookup failed for ${did}: ${response.status} ${response.statusText}`
    );
  }
  const document = (await response.json()) as DidDocument;
  const service = document.service?.find(
    (candidate) => candidate.id === '#atproto_pds' || candidate.type === 'AtprotoPersonalDataServer'
  );
  const endpoint =
    typeof service?.serviceEndpoint === 'string'
      ? service.serviceEndpoint
      : service?.serviceEndpoint?.uri;
  if (!endpoint) throw new Error(`DID document for ${did} does not advertise an AT Protocol PDS`);

  const normalized = endpoint.replace(/\/$/, '');
  endpointCache.set(did, normalized);
  return normalized;
}

async function publicAgent(did: string): Promise<AtpAgent> {
  return new AtpAgent({ service: await resolvePdsEndpoint(did) });
}

/**
 * Fetch a record from its author's PDS. The authenticated client is attempted
 * first for compatibility with PDS proxying and test doubles; cross-PDS
 * discovery is the fallback rather than an assumption that every record lives
 * on the current user's server.
 */
export async function getRecordFromDid(
  client: TangledApiClient,
  did: string,
  collection: string,
  rkey: string
): Promise<{ data: { uri: string; cid?: string; value: unknown } }> {
  try {
    return await client.getAgent().com.atproto.repo.getRecord({ repo: did, collection, rkey });
  } catch (proxiedError) {
    // Test doubles and narrow embedders may provide only getAgent(). Without
    // session identity there is no sound basis for deciding that a cross-PDS
    // retry is appropriate, so preserve the original response.
    if (!client.getSession || did === client.getSession()?.did) throw proxiedError;
    try {
      const agent = await publicAgent(did);
      return await agent.com.atproto.repo.getRecord({ repo: did, collection, rkey });
    } catch (directError) {
      // A definite record-missing response is more specific than a secondary
      // DID/PDS discovery failure encountered while attempting the fallback.
      if (proxiedError instanceof Error && /record not found/i.test(proxiedError.message)) {
        throw proxiedError;
      }
      throw directError;
    }
  }
}

/** List every page of records directly from a DID's authoritative PDS. */
export async function listAllRecordsFromDid(
  client: TangledApiClient,
  did: string,
  collection: string,
  pageSize = 100
): Promise<Array<{ uri: string; cid?: string; value: unknown }>> {
  const records: Array<{ uri: string; cid?: string; value: unknown }> = [];
  let cursor: string | undefined;
  let agent = client.getAgent();
  let retriedDirect = false;

  for (;;) {
    let response: Awaited<ReturnType<typeof agent.com.atproto.repo.listRecords>>;
    try {
      response = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection,
        limit: pageSize,
        ...(cursor && { cursor }),
      });
    } catch (proxiedError) {
      if (!client.getSession || retriedDirect || did === client.getSession()?.did) {
        throw proxiedError;
      }
      agent = await publicAgent(did);
      retriedDirect = true;
      continue;
    }
    records.push(...response.data.records);
    cursor = response.data.cursor;
    if (!cursor) return records;
  }
}

export function clearPdsEndpointCache(): void {
  endpointCache.clear();
}
