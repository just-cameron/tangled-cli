import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AtpSessionData } from '@atproto/api';
import type { NodeSavedSession, NodeSavedState } from '@atproto/oauth-client-node';
import { InvalidCredentialDataError, KeychainAccessError } from './errors.js';
import { deleteKeychainSecret, loadKeychainSecret, saveKeychainSecret } from './keychain.js';

export { InvalidCredentialDataError, KeychainAccessError } from './errors.js';

const SERVICE_NAME = 'tangled-cli';
const OAUTH_SESSION_SERVICE_NAME = 'tangled-cli-oauth-session';
const OAUTH_STATE_SERVICE_NAME = 'tangled-cli-oauth-state';
const SESSION_METADATA_PATH = join(homedir(), '.config', 'tangled', 'session.json');

export interface SessionMetadata {
  handle: string;
  did: string;
  pds: string;
  authType?: 'app-password' | 'oauth';
  lastUsed: string; // ISO timestamp
}

async function saveKeychainJson(service: string, accountId: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  await saveKeychainSecret(service, accountId, serialized);
}

async function loadKeychainJson<T>(service: string, accountId: string): Promise<T | null> {
  const serialized = await loadKeychainSecret(service, accountId);
  if (!serialized) return null;
  try {
    return JSON.parse(serialized) as T;
  } catch {
    // JSON.parse includes the source text in its error on some runtimes. That
    // source is a credential and must never flow into a user-visible message.
    throw new InvalidCredentialDataError();
  }
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

    await saveKeychainJson(SERVICE_NAME, accountId, sessionData);
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
    return await loadKeychainJson<AtpSessionData>(SERVICE_NAME, accountId);
  } catch (error) {
    if (error instanceof InvalidCredentialDataError) throw error;
    throw new KeychainAccessError(
      `Cannot access keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function saveOAuthSession(sub: string, sessionData: NodeSavedSession): Promise<void> {
  try {
    await saveKeychainJson(OAUTH_SESSION_SERVICE_NAME, sub, sessionData);
  } catch (error) {
    throw new Error(
      `Failed to save OAuth session to keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function loadOAuthSession(sub: string): Promise<NodeSavedSession | null> {
  try {
    return await loadKeychainJson<NodeSavedSession>(OAUTH_SESSION_SERVICE_NAME, sub);
  } catch (error) {
    if (error instanceof InvalidCredentialDataError) throw error;
    throw new KeychainAccessError(
      `Cannot access keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteOAuthSession(sub: string): Promise<boolean> {
  try {
    return await deleteKeychainSecret(OAUTH_SESSION_SERVICE_NAME, sub);
  } catch (error) {
    throw new Error(
      `Failed to delete OAuth session from keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function saveOAuthState(key: string, state: NodeSavedState): Promise<void> {
  await saveKeychainJson(OAUTH_STATE_SERVICE_NAME, key, state);
}

export async function loadOAuthState(key: string): Promise<NodeSavedState | null> {
  try {
    return await loadKeychainJson<NodeSavedState>(OAUTH_STATE_SERVICE_NAME, key);
  } catch (error) {
    if (error instanceof InvalidCredentialDataError) throw error;
    throw new KeychainAccessError(
      `Cannot access keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteOAuthState(key: string): Promise<boolean> {
  return await deleteKeychainSecret(OAUTH_STATE_SERVICE_NAME, key);
}

/**
 * Delete session from OS keychain
 * @param accountId - User's DID or handle
 */
export async function deleteSession(accountId: string): Promise<boolean> {
  try {
    return await deleteKeychainSecret(SERVICE_NAME, accountId);
  } catch (error) {
    throw new Error(
      `Failed to delete session from keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Store metadata about current session for CLI to track active user.
 * Written to a plain file — metadata is not secret and must be readable
 * even when the keychain is locked (e.g. after sleep/wake).
 */
export async function saveCurrentSessionMetadata(metadata: SessionMetadata): Promise<void> {
  await mkdir(join(homedir(), '.config', 'tangled'), { recursive: true });
  await writeFile(SESSION_METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf-8');
}

/**
 * Get metadata about current active session
 */
export async function getCurrentSessionMetadata(): Promise<SessionMetadata | null> {
  try {
    const content = await readFile(SESSION_METADATA_PATH, 'utf-8');
    return JSON.parse(content) as SessionMetadata;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Clear current session metadata
 */
export async function clearCurrentSessionMetadata(): Promise<void> {
  try {
    await unlink(SESSION_METADATA_PATH);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
