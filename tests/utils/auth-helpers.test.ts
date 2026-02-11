import { execSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TangledApiClient } from '../../src/lib/api-client.js';
import { KeychainAccessError } from '../../src/lib/session.js';
import { ensureAuthenticated, requireAuth } from '../../src/utils/auth-helpers.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

// Mock API client factory
const createMockClient = (
  authenticated: boolean,
  session: { did: string; handle: string } | null
): TangledApiClient => {
  return {
    isAuthenticated: vi.fn(() => authenticated),
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

describe('ensureAuthenticated', () => {
  // biome-ignore lint/suspicious/noExplicitAny: spy instance types vary by platform signature
  let mockExit: any;
  // biome-ignore lint/suspicious/noExplicitAny: spy instance types vary by platform signature
  let mockConsoleError: any;

  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(execSync).mockReset();
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should return normally when resumeSession succeeds', async () => {
    const mockClient = {
      resumeSession: vi.fn().mockResolvedValue(true),
    } as unknown as TangledApiClient;

    await expect(ensureAuthenticated(mockClient)).resolves.toBeUndefined();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should exit with error when not authenticated', async () => {
    const mockClient = {
      resumeSession: vi.fn().mockResolvedValue(false),
    } as unknown as TangledApiClient;

    await expect(ensureAuthenticated(mockClient)).rejects.toThrow('process.exit called');
    expect(mockConsoleError).toHaveBeenCalledWith(
      '✗ Not authenticated. Run "tangled auth login" first.'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should unlock keychain and retry when KeychainAccessError is thrown', async () => {
    const mockClient = {
      resumeSession: vi
        .fn()
        .mockRejectedValueOnce(new KeychainAccessError('locked'))
        .mockResolvedValueOnce(true),
    } as unknown as TangledApiClient;

    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    await expect(ensureAuthenticated(mockClient)).resolves.toBeUndefined();
    expect(execSync).toHaveBeenCalledWith('security unlock-keychain', { stdio: 'inherit' });
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should exit with keychain error when unlock fails', async () => {
    const mockClient = {
      resumeSession: vi.fn().mockRejectedValue(new KeychainAccessError('locked')),
    } as unknown as TangledApiClient;

    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('unlock failed');
    });

    await expect(ensureAuthenticated(mockClient)).rejects.toThrow('process.exit called');
    expect(mockConsoleError).toHaveBeenCalledWith(
      '✗ Cannot access keychain. Please unlock your Mac keychain and try again.'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit with keychain error when unlock succeeds but retry fails', async () => {
    const mockClient = {
      resumeSession: vi
        .fn()
        .mockRejectedValueOnce(new KeychainAccessError('locked'))
        .mockRejectedValueOnce(new KeychainAccessError('still locked')),
    } as unknown as TangledApiClient;

    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    await expect(ensureAuthenticated(mockClient)).rejects.toThrow('process.exit called');
    expect(mockConsoleError).toHaveBeenCalledWith(
      '✗ Cannot access keychain. Please unlock your Mac keychain and try again.'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should rethrow unexpected errors', async () => {
    const mockClient = {
      resumeSession: vi.fn().mockRejectedValue(new Error('unexpected network error')),
    } as unknown as TangledApiClient;

    await expect(ensureAuthenticated(mockClient)).rejects.toThrow('unexpected network error');
    expect(mockExit).not.toHaveBeenCalled();
  });
});
