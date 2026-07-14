import { execSync } from 'node:child_process';
import type { TangledApiClient } from '../lib/api-client.js';
import { InvalidCredentialDataError, KeychainAccessError } from '../lib/session.js';

/**
 * Validate that the client is authenticated and has an active session
 * @throws Error if not authenticated or no session found
 * @returns The current session with did and handle
 */
export async function requireAuth(client: TangledApiClient): Promise<{
  did: string;
  handle: string;
}> {
  if (!client.isAuthenticated()) {
    throw new Error('Must be authenticated. Run "tang auth login" first.');
  }

  const session = client.getSession();
  if (!session) {
    throw new Error('No active session found');
  }

  return session;
}

function tryUnlockKeychain(): boolean {
  if (process.platform !== 'darwin') return false;
  try {
    execSync('security unlock-keychain', { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resume session and ensure the client is authenticated.
 * On macOS, if the keychain is locked, attempts to unlock it interactively
 * via `security unlock-keychain` before falling back to an error message.
 * Exits the process with a clear error message if authentication fails.
 */
export async function ensureAuthenticated(client: TangledApiClient): Promise<void> {
  try {
    const authenticated = await client.resumeSession();
    if (!authenticated) {
      console.error('✗ Not authenticated. Run "tang auth login" first.');
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof InvalidCredentialDataError) {
      console.error('✗ Stored authentication data is invalid.');
      console.error('  Run "tang auth logout --yes", then "tang auth login".');
      process.exit(1);
    }
    if (error instanceof KeychainAccessError) {
      const unlocked = tryUnlockKeychain();
      if (unlocked) {
        try {
          const retried = await client.resumeSession();
          if (retried) return;
        } catch {
          // fall through to error message
        }
      }
      console.error('✗ Cannot access keychain. Please unlock your Mac keychain and try again.');
      console.error('  You can unlock it manually with: security unlock-keychain');
      process.exit(1);
    }
    throw error;
  }
}
