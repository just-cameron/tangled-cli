import type { AtpSessionData } from '@atproto/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearCurrentSessionMetadata,
  deleteSession,
  getCurrentSessionMetadata,
  loadSession,
  saveCurrentSessionMetadata,
  saveSession,
} from '../../src/lib/session.js';
import { mockSessionData, mockSessionData2, mockSessionMetadata } from '../helpers/mock-data.js';

const mockKeyringStorage = new Map<string, string>();

vi.mock('../../src/lib/keychain.js', () => ({
  saveKeychainSecret: vi.fn(
    async (service: string, account: string, password: string): Promise<void> => {
      mockKeyringStorage.set(`${service}:${account}`, password);
    }
  ),
  loadKeychainSecret: vi.fn(
    async (service: string, account: string): Promise<string | null> =>
      mockKeyringStorage.get(`${service}:${account}`) ?? null
  ),
  deleteKeychainSecret: vi.fn(
    async (service: string, account: string): Promise<boolean> =>
      mockKeyringStorage.delete(`${service}:${account}`)
  ),
}));

// Mock node:fs/promises for metadata file storage
const mockFileStorage = new Map<string, string>();

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockImplementation(async (path: string, content: string) => {
    mockFileStorage.set(path as string, content);
  }),
  readFile: vi.fn().mockImplementation(async (path: string) => {
    const content = mockFileStorage.get(path as string);
    if (content === undefined) {
      const err = Object.assign(new Error(`ENOENT: no such file or directory, open '${path}'`), {
        code: 'ENOENT',
      });
      throw err;
    }
    return content;
  }),
  unlink: vi.fn().mockImplementation(async (path: string) => {
    if (!mockFileStorage.has(path as string)) {
      const err = Object.assign(new Error(`ENOENT: no such file or directory, unlink '${path}'`), {
        code: 'ENOENT',
      });
      throw err;
    }
    mockFileStorage.delete(path as string);
  }),
}));

describe('Session Management', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    mockKeyringStorage.clear();
    mockFileStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    mockKeyringStorage.clear();
    mockFileStorage.clear();
  });

  describe('saveSession', () => {
    it('should save session to keychain using DID', async () => {
      await saveSession(mockSessionData);

      // Verify session was stored
      const loaded = await loadSession(mockSessionData.did);
      expect(loaded).toEqual(mockSessionData);
    });

    it('should save and retrieve session with all required fields', async () => {
      await saveSession(mockSessionData2);

      // Verify session was stored (keyed by DID)
      const loaded = await loadSession(mockSessionData2.did);
      expect(loaded).toEqual(mockSessionData2);
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
      await saveSession(mockSessionData);
      const result = await loadSession(mockSessionData.did);

      expect(result).toEqual(mockSessionData);
    });

    it('should return null when session not found', async () => {
      const result = await loadSession('did:plc:notfound');
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session from keychain', async () => {
      await saveSession(mockSessionData);

      // Verify session exists
      let loaded = await loadSession(mockSessionData.did);
      expect(loaded).toEqual(mockSessionData);

      // Delete session
      const deleted = await deleteSession(mockSessionData.did);
      expect(deleted).toBe(true);

      // Verify session no longer exists
      loaded = await loadSession(mockSessionData.did);
      expect(loaded).toBeNull();
    });

    it('should return false when deleting non-existent session', async () => {
      const deleted = await deleteSession('did:plc:notfound');
      expect(deleted).toBe(false);
    });
  });

  describe('session metadata', () => {
    it('should save and load current session metadata', async () => {
      await saveCurrentSessionMetadata(mockSessionMetadata);
      const result = await getCurrentSessionMetadata();

      expect(result).toEqual(mockSessionMetadata);
    });

    it('should return null when no metadata exists', async () => {
      const result = await getCurrentSessionMetadata();
      expect(result).toBeNull();
    });

    it('should clear current session metadata', async () => {
      await saveCurrentSessionMetadata(mockSessionMetadata);

      // Verify metadata exists
      let result = await getCurrentSessionMetadata();
      expect(result).toEqual(mockSessionMetadata);

      // Clear metadata
      await clearCurrentSessionMetadata();

      // Verify metadata no longer exists
      result = await getCurrentSessionMetadata();
      expect(result).toBeNull();
    });
  });
});
