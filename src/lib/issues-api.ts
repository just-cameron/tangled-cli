import { parseAtUri } from '../utils/at-uri.js';
import { requireAuth } from '../utils/auth-helpers.js';
import type { TangledApiClient } from './api-client.js';
import { getBacklinks } from './constellation.js';

/**
 * Issue record type based on sh.tangled.repo.issue lexicon
 * @see lexicons/sh/tangled/issue/issue.json
 */
export interface IssueRecord {
  $type: 'sh.tangled.repo.issue';
  repo: string;
  title: string;
  body?: string;
  createdAt: string;
  mentions?: string[];
  references?: string[];
  [key: string]: unknown;
}

/**
 * Issue record with metadata
 */
export interface IssueWithMetadata extends IssueRecord {
  uri: string; // AT-URI of the issue
  cid: string; // Content ID
  author: string; // Creator's DID
}

/**
 * Parameters for creating an issue
 */
export interface CreateIssueParams {
  client: TangledApiClient;
  repoAtUri: string;
  title: string;
  body?: string;
}

/**
 * Parameters for listing issues
 */
export interface ListIssuesParams {
  client: TangledApiClient;
  repoAtUri: string;
  limit?: number;
  cursor?: string;
}

/**
 * Parameters for getting a specific issue
 */
export interface GetIssueParams {
  client: TangledApiClient;
  issueUri: string;
}

/**
 * Parameters for updating an issue
 */
export interface UpdateIssueParams {
  client: TangledApiClient;
  issueUri: string;
  title?: string;
  body?: string;
}

/**
 * Parameters for closing an issue
 */
export interface CloseIssueParams {
  client: TangledApiClient;
  issueUri: string;
}

/**
 * Parameters for getting issue state
 */
export interface GetIssueStateParams {
  client: TangledApiClient;
  issueUri: string;
}

/**
 * Parameters for reopening an issue
 */
export interface ReopenIssueParams {
  client: TangledApiClient;
  issueUri: string;
}

/**
 * Parse and validate an issue AT-URI
 * @throws Error if URI is invalid or missing rkey
 * @returns Parsed URI components
 */
function parseIssueUri(issueUri: string): {
  did: string;
  collection: string;
  rkey: string;
} {
  const parsed = parseAtUri(issueUri);
  if (!parsed || !parsed.rkey) {
    throw new Error(`Invalid issue AT-URI: ${issueUri}`);
  }

  return {
    did: parsed.did,
    collection: parsed.collection,
    rkey: parsed.rkey,
  };
}

/**
 * Create a new issue
 */
export async function createIssue(params: CreateIssueParams): Promise<IssueWithMetadata> {
  const { client, repoAtUri, title, body } = params;

  // Validate authentication
  const session = await requireAuth(client);

  // Build issue record
  const record: IssueRecord = {
    $type: 'sh.tangled.repo.issue',
    repo: repoAtUri,
    title,
    body,
    createdAt: new Date().toISOString(),
  };

  try {
    // Create record via AT Protocol
    const response = await client.getAgent().com.atproto.repo.createRecord({
      repo: session.did,
      collection: 'sh.tangled.repo.issue',
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
      throw new Error(`Failed to create issue: ${error.message}`);
    }
    throw new Error('Failed to create issue: Unknown error');
  }
}

/**
 * List issues for a repository
 */
export async function listIssues(params: ListIssuesParams): Promise<{
  issues: IssueWithMetadata[];
  cursor?: string;
}> {
  const { client, repoAtUri, limit = 50, cursor } = params;

  // Validate authentication
  await requireAuth(client);

  try {
    // Query constellation for all issues that reference this repo across all PDSs
    const backlinks = await getBacklinks(
      repoAtUri,
      'sh.tangled.repo.issue',
      '.repo',
      limit,
      cursor
    );

    // Fetch each issue record individually (constellation only gives us the AT-URI components)
    const issuePromises = backlinks.records.map(async ({ did, collection, rkey }) => {
      const response = await client.getAgent().com.atproto.repo.getRecord({
        repo: did,
        collection,
        rkey,
      });
      return {
        ...(response.data.value as IssueRecord),
        uri: response.data.uri,
        cid: response.data.cid as string,
        author: did,
      };
    });

    const issues = await Promise.all(issuePromises);

    return {
      issues,
      cursor: backlinks.cursor ?? undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list issues: ${error.message}`);
    }
    throw new Error('Failed to list issues: Unknown error');
  }
}

/**
 * Get a specific issue
 */
export async function getIssue(params: GetIssueParams): Promise<IssueWithMetadata> {
  const { client, issueUri } = params;

  // Validate authentication
  await requireAuth(client);

  // Parse issue URI
  const { did, collection, rkey } = parseIssueUri(issueUri);

  try {
    // Get record via AT Protocol
    const response = await client.getAgent().com.atproto.repo.getRecord({
      repo: did,
      collection,
      rkey,
    });

    const record = response.data.value as IssueRecord;

    return {
      ...record,
      uri: response.data.uri,
      cid: response.data.cid as string, // CID is always present in AT Protocol responses
      author: did,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error(`Issue not found: ${issueUri}`);
      }
      throw new Error(`Failed to get issue: ${error.message}`);
    }
    throw new Error('Failed to get issue: Unknown error');
  }
}

/**
 * Update an issue (title and/or body)
 */
export async function updateIssue(params: UpdateIssueParams): Promise<IssueWithMetadata> {
  const { client, issueUri, title, body } = params;

  // Validate authentication
  const session = await requireAuth(client);

  // Parse issue URI
  const { did, collection, rkey } = parseIssueUri(issueUri);

  // Verify user owns the issue
  if (did !== session.did) {
    throw new Error('Cannot update issue: you are not the author');
  }

  try {
    // Get current issue to merge with updates
    const currentIssue = await getIssue({ client, issueUri });

    // Build updated record (merge existing with new values)
    const updatedRecord: IssueRecord = {
      ...currentIssue,
      ...(title !== undefined && { title }),
      ...(body !== undefined && { body }),
    };

    // Update record with CID swap for atomic update
    const response = await client.getAgent().com.atproto.repo.putRecord({
      repo: did,
      collection,
      rkey,
      record: updatedRecord,
      swapRecord: currentIssue.cid,
    });

    return {
      ...updatedRecord,
      uri: issueUri,
      cid: response.data.cid,
      author: did,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update issue: ${error.message}`);
    }
    throw new Error('Failed to update issue: Unknown error');
  }
}

/**
 * Close an issue by creating/updating a state record
 */
export async function closeIssue(params: CloseIssueParams): Promise<void> {
  const { client, issueUri } = params;

  // Validate authentication
  const session = await requireAuth(client);

  try {
    // Verify issue exists
    await getIssue({ client, issueUri });

    // Create state record
    const stateRecord = {
      $type: 'sh.tangled.repo.issue.state',
      issue: issueUri,
      state: 'sh.tangled.repo.issue.state.closed',
    };

    // Create state record
    await client.getAgent().com.atproto.repo.createRecord({
      repo: session.did,
      collection: 'sh.tangled.repo.issue.state',
      record: stateRecord,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to close issue: ${error.message}`);
    }
    throw new Error('Failed to close issue: Unknown error');
  }
}

/**
 * Get the state of an issue (open or closed)
 * @returns 'open' or 'closed' (defaults to 'open' if no state record exists)
 */
export async function getIssueState(params: GetIssueStateParams): Promise<'open' | 'closed'> {
  const { client, issueUri } = params;

  // Validate authentication
  await requireAuth(client);

  try {
    // Query constellation for all state records that reference this issue across all PDSs
    const backlinks = await getBacklinks(issueUri, 'sh.tangled.repo.issue.state', '.issue', 100);

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
          state?: 'sh.tangled.repo.issue.state.open' | 'sh.tangled.repo.issue.state.closed';
        },
      };
    });

    const stateRecords = await Promise.all(statePromises);

    // Sort by rkey ascending — TID rkeys are time-ordered, so the last is most recent
    stateRecords.sort((a, b) => a.rkey.localeCompare(b.rkey));
    const latestState = stateRecords[stateRecords.length - 1];

    if (latestState.value.state === 'sh.tangled.repo.issue.state.closed') {
      return 'closed';
    }

    return 'open';
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get issue state: ${error.message}`);
    }
    throw new Error('Failed to get issue state: Unknown error');
  }
}

/**
 * Resolve a sequential issue number from a displayId or by scanning the issue list.
 * Fast path: if displayId is "#N", return N directly.
 * Fallback: fetch all issues, sort oldest-first, return 1-based position.
 */
export async function resolveSequentialNumber(
  displayId: string,
  issueUri: string,
  client: TangledApiClient,
  repoAtUri: string
): Promise<number | undefined> {
  const match = displayId.match(/^#(\d+)$/);
  if (match) return Number.parseInt(match[1], 10);

  const { issues } = await listIssues({ client, repoAtUri, limit: 100 });
  const sorted = issues.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const idx = sorted.findIndex((i) => i.uri === issueUri);
  return idx >= 0 ? idx + 1 : undefined;
}

/**
 * Canonical JSON shape for a single issue, used by all issue commands.
 */
export interface IssueData {
  number: number | undefined;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  author: string;
  createdAt: string;
  uri: string;
  cid: string;
}

/**
 * Fetch a complete IssueData object ready for JSON output.
 * Fetches the issue record and sequential number in parallel.
 * If stateOverride is supplied (e.g. 'closed' after a close operation),
 * getIssueState is skipped; otherwise the current state is fetched.
 */
export async function getCompleteIssueData(
  client: TangledApiClient,
  issueUri: string,
  displayId: string,
  repoAtUri: string,
  stateOverride?: 'open' | 'closed'
): Promise<IssueData> {
  const [issue, number] = await Promise.all([
    getIssue({ client, issueUri }),
    resolveSequentialNumber(displayId, issueUri, client, repoAtUri),
  ]);
  const state = stateOverride ?? (await getIssueState({ client, issueUri }));
  return {
    number,
    title: issue.title,
    body: issue.body,
    state,
    author: issue.author,
    createdAt: issue.createdAt,
    uri: issue.uri,
    cid: issue.cid,
  };
}

/**
 * Reopen a closed issue by creating an open state record
 */
export async function reopenIssue(params: ReopenIssueParams): Promise<void> {
  const { client, issueUri } = params;

  // Validate authentication
  const session = await requireAuth(client);

  try {
    // Verify issue exists
    await getIssue({ client, issueUri });

    // Create state record with open state
    const stateRecord = {
      $type: 'sh.tangled.repo.issue.state',
      issue: issueUri,
      state: 'sh.tangled.repo.issue.state.open',
    };

    // Create state record
    await client.getAgent().com.atproto.repo.createRecord({
      repo: session.did,
      collection: 'sh.tangled.repo.issue.state',
      record: stateRecord,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to reopen issue: ${error.message}`);
    }
    throw new Error('Failed to reopen issue: Unknown error');
  }
}
