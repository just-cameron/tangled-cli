import type { TangledApiClient } from '../lib/api-client.js';

const REPO_AT_URI_PATTERN = /at:\/\/did:plc:[a-z0-9]+\/sh\.tangled\.repo\/[a-zA-Z0-9._~-]+/g;

/**
 * Parse an AT-URI into its components
 * @param uri - AT-URI string (e.g., "at://did:plc:abc/collection/rkey")
 * @returns Parsed components or null if invalid
 */
export function parseAtUri(uri: string): {
  did: string;
  collection: string;
  rkey?: string;
} | null {
  // AT-URI format: at://did:method:identifier/collection[/rkey]
  const match = uri.match(
    /^at:\/\/(did:[a-z]+:[a-zA-Z0-9._:%-]+)\/([a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9._-]+)*)(?:\/([a-zA-Z0-9._-]+))?$/
  );

  if (!match) {
    return null;
  }

  const [, did, collection, rkey] = match;
  return {
    did,
    collection,
    ...(rkey && { rkey }),
  };
}

/**
 * Resolve a handle to a DID using the AT Protocol identity resolution
 * @param handle - Handle string (e.g., "mark.bsky.social" or "@mark.bsky.social")
 * @param client - Authenticated API client
 * @returns DID string (e.g., "did:plc:abc123")
 * @throws Error if handle cannot be resolved
 */
export async function resolveHandleToDid(
  handle: string,
  client: TangledApiClient
): Promise<string> {
  // Strip leading @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  try {
    const response = await client.getAgent().com.atproto.identity.resolveHandle({
      handle: cleanHandle,
    });

    if (!response.data.did) {
      throw new Error(`No DID found for handle: ${cleanHandle}`);
    }

    return response.data.did;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to resolve handle '${cleanHandle}': ${error.message}`);
    }
    throw new Error(`Failed to resolve handle '${cleanHandle}': Unknown error`);
  }
}

/**
 * Resolve a Tangled stable repository DID permalink to the canonical
 * sh.tangled.repo AT-URI used by issues, stars, and backlinks.
 *
 * Stable clone URLs look like `git@tangled.org:did:plc:...`; that DID is a
 * repository permalink, not the owner DID + repo record key pair. The Tangled
 * HTML page already exposes the canonical repo AT-URI for social records, so
 * use it as a compatibility fallback until the CLI has a first-class AppView
 * resolver endpoint.
 */
export async function resolveStableRepoDidToAtUri(repoDid: string): Promise<string> {
  const response = await fetch(`https://tangled.org/${repoDid}`, {
    headers: { accept: 'text/html' },
  });

  if (!response.ok) {
    throw new Error(`Tangled permalink lookup failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const matches = Array.from(new Set(html.match(REPO_AT_URI_PATTERN) ?? []));

  if (matches.length === 0) {
    throw new Error(`No repository AT-URI found for stable DID ${repoDid}`);
  }

  return matches[0];
}

/**
 * Build a repository AT-URI from owner and repository name
 * @param ownerDidOrHandle - DID (e.g., "did:plc:abc") or handle (e.g., "mark.bsky.social")
 * @param repoName - Repository name
 * @param client - Authenticated API client
 * @returns AT-URI string (e.g., "at://did:plc:abc/sh.tangled.repo/3mef23waqwq22")
 * @throws Error if repository not found
 */
export async function buildRepoAtUri(
  ownerDidOrHandle: string,
  repoName: string,
  client: TangledApiClient
): Promise<string> {
  // Resolve owner to DID
  const isDid = ownerDidOrHandle.startsWith('did:');

  // Stable DID-only remotes set owner and name to the same DID in git.ts.
  // Resolve the permalink directly instead of treating the repo DID as an
  // owner account and trying to list sh.tangled.repo records under it.
  if (isDid && ownerDidOrHandle === repoName) {
    try {
      return await resolveStableRepoDidToAtUri(ownerDidOrHandle);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to resolve repository AT-URI: ${error.message}`);
      }
      throw new Error('Failed to resolve repository AT-URI: Unknown error');
    }
  }

  const did = isDid ? ownerDidOrHandle : await resolveHandleToDid(ownerDidOrHandle, client);

  try {
    // Query for sh.tangled.repo records
    const response = await client.getAgent().com.atproto.repo.listRecords({
      repo: did,
      collection: 'sh.tangled.repo',
      limit: 100, // Reasonable limit for most users
    });

    // Find the record matching the repo name
    const repoRecord = response.data.records.find((record) => {
      const recordData = record.value as { name?: string };
      return recordData.name === repoName;
    });

    if (!repoRecord) {
      throw new Error(`Repository '${repoName}' not found for ${ownerDidOrHandle}`);
    }

    // Return the record's URI (which includes the correct rkey)
    return repoRecord.uri;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to resolve repository AT-URI: ${error.message}`);
    }
    throw new Error('Failed to resolve repository AT-URI: Unknown error');
  }
}
