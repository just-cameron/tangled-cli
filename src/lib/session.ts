import type { AtpSessionData } from '@atproto/api';
import { AsyncEntry } from '@napi-rs/keyring';

const SERVICE_NAME = 'tangled-cli';

export interface SessionMetadata {
  handle: string;
  did: string;
  pds: string;
  lastUsed: string; // ISO timestamp
}

/**
 * Store session data in OS keychain
 * @param sessionData - Session data from AtpAgent
 */
export async function saveSession(sessionData: AtpSessionData): Promise<void> {
  try {
    const accountId = sessionData.did || sessionData.handle;
    if (!accountId) {
      throw new Error('Session data must include DID or handle');
    }

    const serialized = JSON.stringify(sessionData);
    const entry = new AsyncEntry(SERVICE_NAME, accountId);
    await entry.setPassword(serialized);
  } catch (error) {
    throw new Error(
      `Failed to save session to keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieve session data from OS keychain
 * @param accountId - User's DID or handle
 */
export async function loadSession(accountId: string): Promise<AtpSessionData | null> {
  try {
    const entry = new AsyncEntry(SERVICE_NAME, accountId);
    const serialized = await entry.getPassword();
    if (!serialized) {
      return null;
    }
    return JSON.parse(serialized) as AtpSessionData;
  } catch (error) {
    throw new Error(
      `Failed to load session from keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete session from OS keychain
 * @param accountId - User's DID or handle
 */
export async function deleteSession(accountId: string): Promise<boolean> {
  try {
    const entry = new AsyncEntry(SERVICE_NAME, accountId);
    return await entry.deleteCredential();
  } catch (error) {
    throw new Error(
      `Failed to delete session from keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Store metadata about current session for CLI to track active user
 * Uses a special "current" account in keychain
 */
export async function saveCurrentSessionMetadata(metadata: SessionMetadata): Promise<void> {
  const serialized = JSON.stringify(metadata);
  const entry = new AsyncEntry(SERVICE_NAME, 'current-session-metadata');
  await entry.setPassword(serialized);
}

/**
 * Get metadata about current active session
 */
export async function getCurrentSessionMetadata(): Promise<SessionMetadata | null> {
  const entry = new AsyncEntry(SERVICE_NAME, 'current-session-metadata');
  const serialized = await entry.getPassword();
  if (!serialized) {
    return null;
  }
  return JSON.parse(serialized) as SessionMetadata;
}

/**
 * Clear current session metadata
 */
export async function clearCurrentSessionMetadata(): Promise<void> {
  const entry = new AsyncEntry(SERVICE_NAME, 'current-session-metadata');
  await entry.deleteCredential();
}
