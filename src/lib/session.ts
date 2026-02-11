import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AtpSessionData } from '@atproto/api';
import { AsyncEntry } from '@napi-rs/keyring';

const SERVICE_NAME = 'tangled-cli';
const SESSION_METADATA_PATH = join(homedir(), '.config', 'tangled', 'session.json');

export class KeychainAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeychainAccessError';
  }
}

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
    throw new KeychainAccessError(
      `Cannot access keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
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
