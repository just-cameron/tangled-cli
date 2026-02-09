import type { AtpSessionData } from '@atproto/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type SessionMetadata,
  clearCurrentSessionMetadata,
  deleteSession,
  getCurrentSessionMetadata,
  loadSession,
  saveCurrentSessionMetadata,
  saveSession,
} from '../../src/lib/session.js';

// Mock @napi-rs/keyring
vi.mock('@napi-rs/keyring', () => {
  const mockStorage = new Map<string, string>();

  return {
    AsyncEntry: vi.fn().mockImplementation((service: string, account: string) => {
      const key = `${service}:${account}`;

      return {
        setPassword: vi.fn().mockImplementation(async (password: string) => {
          mockStorage.set(key, password);
        }),
        getPassword: vi.fn().mockImplementation(async () => {
          return mockStorage.get(key) || null;
        }),
        deleteCredential: vi.fn().mockImplementation(async () => {
          return mockStorage.delete(key);
        }),
      };
    }),
    // Export the storage for test access
    __mockStorage: mockStorage,
  };
});

describe('Session Management', () => {
  beforeEach(async () => {
    // Clear mock storage before each test
    // biome-ignore lint/suspicious/noExplicitAny: accessing mock-specific property
    const keyring = (await import('@napi-rs/keyring')) as any;
    if (keyring.__mockStorage instanceof Map) {
      keyring.__mockStorage.clear();
    }
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    // biome-ignore lint/suspicious/noExplicitAny: accessing mock-specific property
    const keyring = (await import('@napi-rs/keyring')) as any;
    if (keyring.__mockStorage instanceof Map) {
      keyring.__mockStorage.clear();
    }
  });

  describe('saveSession', () => {
    it('should save session to keychain using DID', async () => {
      const sessionData: AtpSessionData = {
        did: 'did:plc:test123',
        handle: 'user.bsky.social',
        email: 'user@example.com',
        emailConfirmed: true,
        active: true,
        accessJwt: 'token123',
        refreshJwt: 'refresh123',
      };

      await saveSession(sessionData);

      // Verify session was stored
      const loaded = await loadSession('did:plc:test123');
      expect(loaded).toEqual(sessionData);
    });

    it('should save and retrieve session with all required fields', async () => {
      const sessionData: AtpSessionData = {
        did: 'did:plc:test456',
        handle: 'user.bsky.social',
        email: 'user@example.com',
        emailConfirmed: true,
        active: true,
        accessJwt: 'token123',
        refreshJwt: 'refresh123',
      };

      await saveSession(sessionData);

      // Verify session was stored (keyed by DID)
      const loaded = await loadSession('did:plc:test456');
      expect(loaded).toEqual(sessionData);
    });

    it('should throw error if session has no DID or handle', async () => {
      const sessionData = {
        email: 'user@example.com',
        accessJwt: 'token123',
        refreshJwt: 'refresh123',
      } as AtpSessionData;

      await expect(saveSession(sessionData)).rejects.toThrow(
        'Session data must include DID or handle'
      );
    });
  });

  describe('loadSession', () => {
    it('should load session from keychain', async () => {
      const sessionData: AtpSessionData = {
        did: 'did:plc:test123',
        handle: 'user.bsky.social',
        active: true,
        accessJwt: 'token123',
        refreshJwt: 'refresh123',
      };

      await saveSession(sessionData);
      const result = await loadSession('did:plc:test123');

      expect(result).toEqual(sessionData);
    });

    it('should return null when session not found', async () => {
      const result = await loadSession('did:plc:notfound');
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session from keychain', async () => {
      const sessionData: AtpSessionData = {
        did: 'did:plc:test123',
        handle: 'user.bsky.social',
        active: true,
        accessJwt: 'token123',
        refreshJwt: 'refresh123',
      };

      await saveSession(sessionData);

      // Verify session exists
      let loaded = await loadSession('did:plc:test123');
      expect(loaded).toEqual(sessionData);

      // Delete session
      const deleted = await deleteSession('did:plc:test123');
      expect(deleted).toBe(true);

      // Verify session no longer exists
      loaded = await loadSession('did:plc:test123');
      expect(loaded).toBeNull();
    });

    it('should return false when deleting non-existent session', async () => {
      const deleted = await deleteSession('did:plc:notfound');
      expect(deleted).toBe(false);
    });
  });

  describe('session metadata', () => {
    it('should save and load current session metadata', async () => {
      const metadata: SessionMetadata = {
        handle: 'user.bsky.social',
        did: 'did:plc:test123',
        pds: 'https://bsky.social',
        lastUsed: new Date().toISOString(),
      };

      await saveCurrentSessionMetadata(metadata);
      const result = await getCurrentSessionMetadata();

      expect(result).toEqual(metadata);
    });

    it('should return null when no metadata exists', async () => {
      const result = await getCurrentSessionMetadata();
      expect(result).toBeNull();
    });

    it('should clear current session metadata', async () => {
      const metadata: SessionMetadata = {
        handle: 'user.bsky.social',
        did: 'did:plc:test123',
        pds: 'https://bsky.social',
        lastUsed: new Date().toISOString(),
      };

      await saveCurrentSessionMetadata(metadata);

      // Verify metadata exists
      let result = await getCurrentSessionMetadata();
      expect(result).toEqual(metadata);

      // Clear metadata
      await clearCurrentSessionMetadata();

      // Verify metadata no longer exists
      result = await getCurrentSessionMetadata();
      expect(result).toBeNull();
    });
  });
});
