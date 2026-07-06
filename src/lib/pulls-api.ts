import type { BlobRef } from '@atproto/lexicon';
import { parseAtUri } from '../utils/at-uri.js';
import { requireAuth } from '../utils/auth-helpers.js';
import type { TangledApiClient } from './api-client.js';
import { getBacklinks } from './constellation.js';

/**
 * Pull request record type based on sh.tangled.repo.pull lexicon
 */
export interface PullRecord {
  $type: 'sh.tangled.repo.pull';
  target: { repo: string; branch: string };
  title: string;
  body?: string;
  patchBlob: BlobRef;
  source?: { branch: string; sha: string; repo?: string };
  createdAt: string;
  mentions?: string[];
  references?: string[];
  [key: string]: unknown;
}

/**
 * Pull request record with metadata
 */
export interface PullWithMetadata extends PullRecord {
  uri: string; // AT-URI of the pull request
  cid: string; // Content ID
  author: string; // Creator's DID
}

/**
 * Parameters for creating a pull request
 */
export interface CreatePullParams {
  client: TangledApiClient;
  repoAtUri: string;
  title: string;
  body?: string;
  targetBranch: string;
  sourceBranch: string;
  sourceSha: string;
  patchBuffer: Buffer;
}

/**
 * Parameters for listing pull requests
 */
export interface ListPullsParams {
  client: TangledApiClient;
  repoAtUri: string;
  limit?: number;
  cursor?: string;
}

/**
 * Parameters for getting a specific pull request
 */
export interface GetPullParams {
  client: TangledApiClient;
  pullUri: string;
}

/**
 * Parameters for getting pull request state
 */
export interface GetPullStateParams {
  client: TangledApiClient;
  pullUri: string;
}

/**
 * Canonical JSON shape for a single pull request, used by all pr commands.
 */
export interface PullData {
  number: number | undefined;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: string;
  uri: string;
  cid: string;
  sourceBranch?: string;
  targetBranch: string;
}

/**
 * Parse and validate a pull request AT-URI
 * @throws Error if URI is invalid or missing rkey
 */
function parsePullUri(pullUri: string): {
  did: string;
  collection: string;
  rkey: string;
} {
  const parsed = parseAtUri(pullUri);
  if (!parsed || !parsed.rkey) {
    throw new Error(`Invalid pull request AT-URI: ${pullUri}`);
  }

  return {
    did: parsed.did,
    collection: parsed.collection,
    rkey: parsed.rkey,
  };
}

/**
 * Create a new pull request
 */
export async function createPull(params: CreatePullParams): Promise<PullWithMetadata> {
  const { client, repoAtUri, title, body, targetBranch, sourceBranch, sourceSha, patchBuffer } =
    params;

  // Validate authentication
  const session = await requireAuth(client);

  try {
    // Upload the gzip-compressed patch as a blob
    const blobResponse = await client.getAgent().com.atproto.repo.uploadBlob(patchBuffer, {
      encoding: 'application/gzip',
    });
    const patchBlob = blobResponse.data.blob;

    // Build pull request record
    const record: PullRecord = {
      $type: 'sh.tangled.repo.pull',
      target: {
        repo: repoAtUri,
        branch: targetBranch,
      },
      title,
      body,
      patchBlob,
      source: {
        branch: sourceBranch,
        sha: sourceSha,
        repo: repoAtUri,
      },
      createdAt: new Date().toISOString(),
    };

    // Create record via AT Protocol
    const response = await client.getAgent().com.atproto.repo.createRecord({
      repo: session.did,
      collection: 'sh.tangled.repo.pull',
      record,
    });

    return {
      ...record,
      uri: response.data.uri,
      cid: response.data.cid,
      author: session.did,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
    throw new Error('Failed to create pull request: Unknown error');
  }
}

/**
 * List pull requests for a repository
 */
export async function listPulls(params: ListPullsParams): Promise<{
  pulls: PullWithMetadata[];
  cursor?: string;
}> {
  const { client, repoAtUri, limit = 50, cursor } = params;

  // Validate authentication
  await requireAuth(client);

  try {
    // Query constellation for all pull requests that reference this repo
    const backlinks = await getBacklinks(
      repoAtUri,
      'sh.tangled.repo.pull',
      '.target.repo',
      limit,
      cursor
    );

    // Fetch each pull request record individually
    const pullPromises = backlinks.records.map(async ({ did, collection, rkey }) => {
      const response = await client.getAgent().com.atproto.repo.getRecord({
        repo: did,
        collection,
        rkey,
      });
      return {
        ...(response.data.value as PullRecord),
        uri: response.data.uri,
        cid: response.data.cid as string,
        author: did,
      };
    });

    const pulls = await Promise.all(pullPromises);

    return {
      pulls,
      cursor: backlinks.cursor ?? undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list pull requests: ${error.message}`);
    }
    throw new Error('Failed to list pull requests: Unknown error');
  }
}

/**
 * Get a specific pull request
 */
export async function getPull(params: GetPullParams): Promise<PullWithMetadata> {
  const { client, pullUri } = params;

  // Validate authentication
  await requireAuth(client);

  // Parse pull URI
  const { did, collection, rkey } = parsePullUri(pullUri);

  try {
    const response = await client.getAgent().com.atproto.repo.getRecord({
      repo: did,
      collection,
      rkey,
    });

    const record = response.data.value as PullRecord;

    return {
      ...record,
      uri: response.data.uri,
      cid: response.data.cid as string,
      author: did,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error(`Pull request not found: ${pullUri}`);
      }
      throw new Error(`Failed to get pull request: ${error.message}`);
    }
    throw new Error('Failed to get pull request: Unknown error');
  }
}

/**
 * Get the state of a pull request (open, closed, or merged)
 * @returns 'open', 'closed', or 'merged' (defaults to 'open' if no state record exists)
 */
export async function getPullState(
  params: GetPullStateParams
): Promise<'open' | 'closed' | 'merged'> {
  const { client, pullUri } = params;

  // Validate authentication
  await requireAuth(client);

  try {
    // Query constellation for all state records that reference this pull request
    const backlinks = await getBacklinks(pullUri, 'sh.tangled.repo.pull.status', '.pull', 100);

    if (backlinks.records.length === 0) {
      return 'open';
    }

    // Fetch each state record in parallel
    const statePromises = backlinks.records.map(async ({ did, collection, rkey }) => {
      const response = await client.getAgent().com.atproto.repo.getRecord({
        repo: did,
        collection,
        rkey,
      });
      return {
        rkey,
        value: response.data.value as {
          status?:
            | 'sh.tangled.repo.pull.status.open'
            | 'sh.tangled.repo.pull.status.closed'
            | 'sh.tangled.repo.pull.status.merged';
        },
      };
    });

    const stateRecords = await Promise.all(statePromises);

    // Sort by rkey ascending — TID rkeys are time-ordered, so the last is most recent
    stateRecords.sort((a, b) => a.rkey.localeCompare(b.rkey));
    const latestState = stateRecords[stateRecords.length - 1];

    if (latestState.value.status === 'sh.tangled.repo.pull.status.closed') {
      return 'closed';
    }
    if (latestState.value.status === 'sh.tangled.repo.pull.status.merged') {
      return 'merged';
    }

    return 'open';
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get pull request state: ${error.message}`);
    }
    throw new Error('Failed to get pull request state: Unknown error');
  }
}

/**
 * Resolve a sequential pull request number from a displayId or by scanning the pull list.
 * Fast path: if displayId is "#N", return N directly.
 * Fallback: fetch all pulls, sort oldest-first, return 1-based position.
 */
export async function resolveSequentialPullNumber(
  displayId: string,
  pullUri: string,
  client: TangledApiClient,
  repoAtUri: string
): Promise<number | undefined> {
  const match = displayId.match(/^#(\d+)$/);
  if (match) return Number.parseInt(match[1], 10);

  const { pulls } = await listPulls({ client, repoAtUri, limit: 100 });
  const sorted = pulls.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const idx = sorted.findIndex((p) => p.uri === pullUri);
  return idx >= 0 ? idx + 1 : undefined;
}

/**
 * Fetch a complete PullData object ready for JSON output.
 * Fetches the pull record and sequential number in parallel.
 */
export async function getCompletePullData(
  client: TangledApiClient,
  pullUri: string,
  displayId: string,
  repoAtUri: string
): Promise<PullData> {
  const [pull, number, state] = await Promise.all([
    getPull({ client, pullUri }),
    resolveSequentialPullNumber(displayId, pullUri, client, repoAtUri),
    getPullState({ client, pullUri }),
  ]);
  return {
    number,
    title: pull.title,
    body: pull.body,
    state,
    author: pull.author,
    createdAt: pull.createdAt,
    uri: pull.uri,
    cid: pull.cid,
    sourceBranch: pull.source?.branch,
    targetBranch: pull.target.branch,
  };
}
