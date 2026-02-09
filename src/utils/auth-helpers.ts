import type { TangledApiClient } from '../lib/api-client.js';

/**
 * Validate that the client is authenticated and has an active session
 * @throws Error if not authenticated or no session found
 * @returns The current session with did and handle
 */
export async function requireAuth(client: TangledApiClient): Promise<{
  did: string;
  handle: string;
}> {
  if (!(await client.isAuthenticated())) {
    throw new Error('Must be authenticated. Run "tangled auth login" first.');
  }

  const session = client.getSession();
  if (!session) {
    throw new Error('No active session found');
  }

  return session;
}
