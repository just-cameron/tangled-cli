import type { TangledApiClient } from '../lib/api-client.js';

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
	const match = uri.match(/^at:\/\/(did:[a-z]+:[a-zA-Z0-9._:%-]+)\/([a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9._-]+)*)(?:\/([a-zA-Z0-9._-]+))?$/);

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
	client: TangledApiClient,
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
			throw new Error(
				`Failed to resolve handle '${cleanHandle}': ${error.message}`,
			);
		}
		throw new Error(`Failed to resolve handle '${cleanHandle}': Unknown error`);
	}
}

/**
 * Build a repository AT-URI from owner and repository name
 * @param ownerDidOrHandle - DID (e.g., "did:plc:abc") or handle (e.g., "mark.bsky.social")
 * @param repoName - Repository name
 * @param client - Authenticated API client
 * @returns AT-URI string (e.g., "at://did:plc:abc/sh.tangled.repo/repoName")
 */
export async function buildRepoAtUri(
	ownerDidOrHandle: string,
	repoName: string,
	client: TangledApiClient,
): Promise<string> {
	// Check if owner is already a DID
	const isDid = ownerDidOrHandle.startsWith('did:');

	let did: string;
	if (isDid) {
		did = ownerDidOrHandle;
	} else {
		// Resolve handle to DID
		did = await resolveHandleToDid(ownerDidOrHandle, client);
	}

	// Construct AT-URI for repository
	// Format: at://{did}/sh.tangled.repo/{repoName}
	return `at://${did}/sh.tangled.repo/${repoName}`;
}
