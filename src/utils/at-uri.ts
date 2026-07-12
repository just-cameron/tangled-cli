import type { TangledApiClient } from '../lib/api-client.js';
import { listAllRecordsFromDid } from '../lib/public-records.js';

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
 * Resolve the repository DID used to populate repo-scoped record fields
 * (e.g. `sh.tangled.repo.issue#repo`, `sh.tangled.repo.pull#target.repo`).
 * Per the current lexicons, these fields hold a bare DID — never an AT-URI.
 *
 * Two cases:
 * - Stable DID-only remotes (`git@tangled.org:did:plc:...`) set owner and
 *   name to the same DID in git.ts; that DID already *is* the repo's stable
 *   identity, so it is returned directly with no network call.
 * - Owner/name remotes resolve the owner (handle or DID) to a DID, list
 *   their `sh.tangled.repo` records, and find the one matching `repoName`
 *   — by the record's `name` field, or (many older/hand-created records
 *   never set `name`, keying the repo through its rkey instead) by the
 *   record's own rkey. If that record carries its own dedicated `repoDid`
 *   ("DID of the repo itself, if assigned" per the lexicon), that is
 *   returned; otherwise the owner's account DID is the best available
 *   identifier.
 *
 * @param ownerDidOrHandle - DID (e.g., "did:plc:abc") or handle (e.g., "mark.bsky.social")
 * @param repoName - Repository name
 * @param client - Authenticated API client
 * @returns Bare DID string (e.g., "did:plc:abc123")
 * @throws Error if the repository cannot be found
 */
export async function resolveRepoDid(
  ownerDidOrHandle: string,
  repoName: string,
  client: TangledApiClient
): Promise<string> {
  const isDid = ownerDidOrHandle.startsWith('did:');

  // Stable DID-only remotes: the DID in the remote URL is already the
  // repo's own stable identity DID.
  if (isDid && ownerDidOrHandle === repoName) {
    return ownerDidOrHandle;
  }

  const did = isDid ? ownerDidOrHandle : await resolveHandleToDid(ownerDidOrHandle, client);

  try {
    const records = await listAllRecordsFromDid(client, did, 'sh.tangled.repo');

    const repoRecord = records.find((record) => {
      const recordData = record.value as { name?: string };
      if (recordData.name === repoName) return true;
      const rkey = record.uri.split('/').pop();
      return rkey === repoName;
    });

    if (!repoRecord) {
      throw new Error(`Repository '${repoName}' not found for ${ownerDidOrHandle}`);
    }

    const recordData = repoRecord.value as { repoDid?: string };
    return recordData.repoDid ?? did;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to resolve repository DID: ${error.message}`);
    }
    throw new Error('Failed to resolve repository DID: Unknown error');
  }
}
