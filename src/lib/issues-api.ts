import { parseAtUri } from '../utils/at-uri.js';
import { requireAuth } from '../utils/auth-helpers.js';
import type { TangledApiClient } from './api-client.js';

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
 * Parameters for deleting an issue
 */
export interface DeleteIssueParams {
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

  // Extract owner DID from repo AT-URI
  const parsed = parseAtUri(repoAtUri);
  if (!parsed) {
    throw new Error(`Invalid repository AT-URI: ${repoAtUri}`);
  }

  const ownerDid = parsed.did;

  try {
    // List all issue records for the owner
    const response = await client.getAgent().com.atproto.repo.listRecords({
      repo: ownerDid,
      collection: 'sh.tangled.repo.issue',
      limit,
      cursor,
    });

    // Filter to only issues for this specific repository
    const issues: IssueWithMetadata[] = response.data.records
      .filter((record) => {
        const issueRecord = record.value as IssueRecord;
        return issueRecord.repo === repoAtUri;
      })
      .map((record) => ({
        ...(record.value as IssueRecord),
        uri: record.uri,
        cid: record.cid,
        author: ownerDid,
      }));

    return {
      issues,
      cursor: response.data.cursor,
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
 * Delete an issue
 */
export async function deleteIssue(params: DeleteIssueParams): Promise<void> {
  const { client, issueUri } = params;

  // Validate authentication
  const session = await requireAuth(client);

  // Parse issue URI
  const { did, collection, rkey } = parseIssueUri(issueUri);

  // Verify user owns the issue
  if (did !== session.did) {
    throw new Error('Cannot delete issue: you are not the author');
  }

  try {
    // Delete record via AT Protocol
    await client.getAgent().com.atproto.repo.deleteRecord({
      repo: did,
      collection,
      rkey,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error(`Issue not found: ${issueUri}`);
      }
      throw new Error(`Failed to delete issue: ${error.message}`);
    }
    throw new Error('Failed to delete issue: Unknown error');
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

  // Parse issue URI to get author DID
  const { did } = parseIssueUri(issueUri);

  try {
    // Query state records for the issue author
    const response = await client.getAgent().com.atproto.repo.listRecords({
      repo: did,
      collection: 'sh.tangled.repo.issue.state',
      limit: 100,
    });

    // Filter to find state records for this specific issue
    const stateRecords = response.data.records.filter((record) => {
      const stateData = record.value as { issue?: string };
      return stateData.issue === issueUri;
    });

    if (stateRecords.length === 0) {
      // No state record found - default to open
      return 'open';
    }

    // Get the most recent state record (AT Protocol records are sorted by index)
    const latestState = stateRecords[stateRecords.length - 1];
    const stateData = latestState.value as {
      state?: 'sh.tangled.repo.issue.state.open' | 'sh.tangled.repo.issue.state.closed';
    };

    // Return 'open' or 'closed' based on the state type
    if (stateData.state === 'sh.tangled.repo.issue.state.closed') {
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
