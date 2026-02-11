import { AtpAgent } from '@atproto/api';
import type { AtpSessionData } from '@atproto/api';
import {
  KeychainAccessError,
  clearCurrentSessionMetadata,
  deleteSession,
  getCurrentSessionMetadata,
  loadSession,
  saveCurrentSessionMetadata,
  saveSession,
} from './session.js';

/**
 * API client wrapper for AT Protocol operations
 * Integrates with session management for persistent authentication
 */
export class TangledApiClient {
  private agent: AtpAgent;

  constructor(serviceUrl = 'https://bsky.social') {
    this.agent = new AtpAgent({ service: serviceUrl });
  }

  /**
   * Login with identifier (handle or DID) and password
   * Supports custom domain handles (e.g., "markbennett.ca")
   *
   * @param identifier - User's handle or DID
   * @param password - App password
   */
  async login(identifier: string, password: string): Promise<AtpSessionData> {
    try {
      const response = await this.agent.login({ identifier, password });

      if (!response.success || !response.data) {
        throw new Error('Login failed: No session data received');
      }

      // Ensure all required fields are present
      const sessionData: AtpSessionData = {
        ...response.data,
        active: response.data.active ?? true,
      };

      // Save session to keychain
      await saveSession(sessionData);

      // Save metadata for current session tracking
      await saveCurrentSessionMetadata({
        handle: sessionData.handle,
        did: sessionData.did,
        pds: this.agent.service.toString(),
        lastUsed: new Date().toISOString(),
      });

      return sessionData;
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Logout and clear session data
   */
  async logout(): Promise<void> {
    const metadata = await getCurrentSessionMetadata();

    if (!metadata) {
      throw new Error('No active session found');
    }

    // Delete session from keychain
    await deleteSession(metadata.did);

    // Clear current session metadata
    await clearCurrentSessionMetadata();
  }

  /**
   * Resume session from stored credentials
   * Returns true if session was successfully resumed
   */
  async resumeSession(): Promise<boolean> {
    try {
      const metadata = await getCurrentSessionMetadata();

      if (!metadata) {
        return false;
      }

      const sessionData = await loadSession(metadata.did);

      if (!sessionData) {
        // Metadata exists but session data is missing - clean up
        await clearCurrentSessionMetadata();
        return false;
      }

      // Resume session with agent
      await this.agent.resumeSession(sessionData);

      // Update last used timestamp
      await saveCurrentSessionMetadata({
        ...metadata,
        lastUsed: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      if (error instanceof KeychainAccessError) {
        // Don't clear credentials — keychain may just be temporarily locked
        throw error;
      }
      // Session data invalid or agent resume failed — clear stale state
      await clearCurrentSessionMetadata();
      return false;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!this.agent.session;
  }

  /**
   * Get the underlying AtpAgent instance
   * Use this for direct API calls
   */
  getAgent(): AtpAgent {
    return this.agent;
  }

  /**
   * Get current session data
   */
  getSession(): AtpSessionData | undefined {
    return this.agent.session;
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(serviceUrl?: string): TangledApiClient {
  return new TangledApiClient(serviceUrl);
}
