import type { AtpSessionData } from '@atproto/api';
import type { SessionMetadata } from '../../src/lib/session.js';

/**
 * Shared mock session data for tests
 */
export const mockSessionData: AtpSessionData = {
  did: 'did:plc:test123',
  handle: 'user.bsky.social',
  email: 'user@example.com',
  emailConfirmed: true,
  active: true,
  accessJwt: 'mock-access-token',
  refreshJwt: 'mock-refresh-token',
};

/**
 * Alternative mock session with different DID
 */
export const mockSessionData2: AtpSessionData = {
  did: 'did:plc:test456',
  handle: 'another.bsky.social',
  email: 'another@example.com',
  emailConfirmed: true,
  active: true,
  accessJwt: 'mock-access-token-2',
  refreshJwt: 'mock-refresh-token-2',
};

/**
 * Mock session metadata
 */
export const mockSessionMetadata: SessionMetadata = {
  handle: 'user.bsky.social',
  did: 'did:plc:test123',
  pds: 'https://bsky.social',
  lastUsed: '2024-01-01T00:00:00.000Z',
};
