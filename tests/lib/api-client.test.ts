import type { AtpSessionData } from '@atproto/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TangledApiClient } from '../../src/lib/api-client.js';
import { KeychainAccessError } from '../../src/lib/session.js';
import * as sessionModule from '../../src/lib/session.js';
import { mockSessionData, mockSessionMetadata } from '../helpers/mock-data.js';

// Mock @atproto/api
vi.mock('@atproto/api', () => {
  return {
    AtpAgent: vi.fn().mockImplementation(() => {
      let currentSession: AtpSessionData | undefined = undefined;

      return {
        service: { toString: () => 'https://bsky.social' },
        get session() {
          return currentSession;
        },
        login: vi.fn().mockImplementation(async () => {
          currentSession = mockSessionData;
          return {
            success: true,
            data: mockSessionData,
          };
        }),
        resumeSession: vi.fn().mockImplementation(async (session) => {
          currentSession = session;
        }),
      };
    }),
  };
});

// Mock session management (use importOriginal to preserve KeychainAccessError class)
vi.mock('../../src/lib/session.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/session.js')>();
  return {
    ...actual,
    saveSession: vi.fn(),
    loadSession: vi.fn(),
    deleteSession: vi.fn(),
    saveCurrentSessionMetadata: vi.fn(),
    getCurrentSessionMetadata: vi.fn(),
    clearCurrentSessionMetadata: vi.fn(),
  };
});

describe('TangledApiClient', () => {
  let client: TangledApiClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(null);
    vi.mocked(sessionModule.loadSession).mockResolvedValue(null);

    client = new TangledApiClient();
  });

  describe('login', () => {
    it('should login successfully and save session', async () => {
      const result = await client.login('user.bsky.social', 'password');

      expect(result).toEqual(mockSessionData);
      expect(vi.mocked(sessionModule.saveSession)).toHaveBeenCalledWith(mockSessionData);
      expect(vi.mocked(sessionModule.saveCurrentSessionMetadata)).toHaveBeenCalledWith({
        handle: mockSessionData.handle,
        did: mockSessionData.did,
        pds: 'https://bsky.social',
        lastUsed: expect.any(String),
      });
    });

    it('should support custom domain handles', async () => {
      const result = await client.login('markbennett.ca', 'password');

      expect(result).toEqual(mockSessionData);
      expect(vi.mocked(sessionModule.saveSession)).toHaveBeenCalled();
    });

    it('should throw error on login failure', async () => {
      const agent = client.getAgent();
      vi.mocked(agent.login).mockResolvedValueOnce({
        success: false,
        headers: {},
        data: undefined,
      } as never);

      await expect(client.login('user.bsky.social', 'wrong')).rejects.toThrow(
        'Login failed: No session data received'
      );
    });
  });

  describe('logout', () => {
    it('should logout and clear session', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(mockSessionMetadata);

      await client.logout();

      expect(vi.mocked(sessionModule.deleteSession)).toHaveBeenCalledWith(mockSessionMetadata.did);
      expect(vi.mocked(sessionModule.clearCurrentSessionMetadata)).toHaveBeenCalled();
    });

    it('should throw error if no active session', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(null);

      await expect(client.logout()).rejects.toThrow('No active session found');
    });
  });

  describe('resumeSession', () => {
    it('should resume session from stored data', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(mockSessionMetadata);
      vi.mocked(sessionModule.loadSession).mockResolvedValue(mockSessionData);

      const resumed = await client.resumeSession();

      expect(resumed).toBe(true);
      expect(vi.mocked(sessionModule.loadSession)).toHaveBeenCalledWith(mockSessionMetadata.did);
      expect(vi.mocked(sessionModule.saveCurrentSessionMetadata)).toHaveBeenCalledWith({
        ...mockSessionMetadata,
        lastUsed: expect.any(String),
      });
    });

    it('should return false if no metadata exists', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(null);

      const resumed = await client.resumeSession();

      expect(resumed).toBe(false);
    });

    it('should return false and cleanup if session data is missing', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(mockSessionMetadata);
      vi.mocked(sessionModule.loadSession).mockResolvedValue(null);

      const resumed = await client.resumeSession();

      expect(resumed).toBe(false);
      expect(vi.mocked(sessionModule.clearCurrentSessionMetadata)).toHaveBeenCalled();
    });

    it('should return false without clearing metadata on transient resume error', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(mockSessionMetadata);
      vi.mocked(sessionModule.loadSession).mockResolvedValue(mockSessionData);

      const agent = client.getAgent();
      vi.mocked(agent.resumeSession).mockRejectedValueOnce(new Error('Resume failed'));

      const resumed = await client.resumeSession();

      expect(resumed).toBe(false);
      expect(vi.mocked(sessionModule.clearCurrentSessionMetadata)).not.toHaveBeenCalled();
    });

    it('should rethrow KeychainAccessError without clearing metadata', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockRejectedValueOnce(
        new KeychainAccessError('Cannot access keychain: locked')
      );

      await expect(client.resumeSession()).rejects.toThrow(KeychainAccessError);
      expect(vi.mocked(sessionModule.clearCurrentSessionMetadata)).not.toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  describe('getAgent', () => {
    it('should return the AtpAgent instance', () => {
      const agent = client.getAgent();
      expect(agent).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should return undefined when not authenticated', () => {
      expect(client.getSession()).toBeUndefined();
    });
  });
});
