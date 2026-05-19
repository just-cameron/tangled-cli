import type { AtpSessionData } from '@atproto/api';
import { type Agent, AtpAgent } from '@atproto/api';
import { restoreOAuthAgent } from './oauth.js';
import {
  clearCurrentSessionMetadata,
  deleteOAuthSession,
  deleteSession,
  getCurrentSessionMetadata,
  KeychainAccessError,
  loadSession,
  saveCurrentSessionMetadata,
  saveSession,
} from './session.js';

/**
 * API client wrapper for AT Protocol operations
 * Integrates with session management for persistent authentication
 */
export class TangledApiClient {
  private agent: AtpAgent | Agent;
  private sessionIdentity?: { did: string; handle: string };

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
      const credentialAgent = this.agent as AtpAgent;
      const response = await credentialAgent.login({ identifier, password });

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
        pds: credentialAgent.service.toString(),
        authType: 'app-password',
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
    if (metadata.authType === 'oauth') {
      await deleteOAuthSession(metadata.did);
    } else {
      await deleteSession(metadata.did);
    }

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

      if (metadata.authType === 'oauth') {
        this.agent = await restoreOAuthAgent(metadata.did, metadata.pds);
        this.sessionIdentity = { did: metadata.did, handle: metadata.handle };
        await saveCurrentSessionMetadata({
          ...metadata,
          lastUsed: new Date().toISOString(),
        });
        return true;
      }

      const sessionData = await loadSession(metadata.did);

      if (!sessionData) {
        // Metadata exists but session data is missing - clean up
        await clearCurrentSessionMetadata();
        return false;
      }

      // Resume session with agent
      await (this.agent as AtpAgent).resumeSession(sessionData);
      this.sessionIdentity = { did: sessionData.did, handle: sessionData.handle };

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
      // Session resume failed (network error, expired refresh token, etc.)
      // Don't clear credentials — the error may be transient. The user can
      // run "auth login" explicitly if they need to re-authenticate.
      return false;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!this.sessionIdentity || !!('session' in this.agent && this.agent.session);
  }

  /**
   * Get the underlying AtpAgent instance
   * Use this for direct API calls
   */
  getAgent(): AtpAgent | Agent {
    return this.agent;
  }

  /**
   * Get current session data
   */
  getSession(): AtpSessionData | undefined {
    if (this.sessionIdentity) {
      return this.sessionIdentity as AtpSessionData;
    }
    return 'session' in this.agent ? this.agent.session : undefined;
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(serviceUrl?: string): TangledApiClient {
  return new TangledApiClient(serviceUrl);
}
