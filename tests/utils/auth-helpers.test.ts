import { describe, expect, it, vi } from 'vitest';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import { requireAuth } from '../../src/utils/auth-helpers.js';

// Mock API client factory
const createMockClient = (
  authenticated: boolean,
  session: { did: string; handle: string } | null
): TangledApiClient => {
  return {
    isAuthenticated: vi.fn(async () => authenticated),
    getSession: vi.fn(() => session),
  } as unknown as TangledApiClient;
};

describe('requireAuth', () => {
  it('should return session when authenticated', async () => {
    const mockSession = { did: 'did:plc:test123', handle: 'test.bsky.social' };
    const mockClient = createMockClient(true, mockSession);

    const result = await requireAuth(mockClient);

    expect(result).toEqual(mockSession);
  });

  it('should throw error when not authenticated', async () => {
    const mockClient = createMockClient(false, null);

    await expect(requireAuth(mockClient)).rejects.toThrow(
      'Must be authenticated. Run "tangled auth login" first.'
    );
  });

  it('should throw error when authenticated but no session', async () => {
    const mockClient = createMockClient(true, null);

    await expect(requireAuth(mockClient)).rejects.toThrow('No active session found');
  });
});
