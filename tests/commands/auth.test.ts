import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthCommand } from '../../src/commands/auth.js';
import * as apiClientModule from '../../src/lib/api-client.js';
import * as sessionModule from '../../src/lib/session.js';
import * as promptsModule from '../../src/utils/prompts.js';
import { mockSessionData, mockSessionMetadata } from '../helpers/mock-data.js';

// Mock modules
vi.mock('../../src/lib/api-client.js');
vi.mock('../../src/lib/session.js');
vi.mock('../../src/utils/prompts.js');

describe('Auth Commands', () => {
  let mockClient: {
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let consoleLogSpy: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;
  let processExitSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API client
    mockClient = {
      login: vi.fn(),
      logout: vi.fn(),
    };
    vi.mocked(apiClientModule.createApiClient).mockReturnValue(mockClient as never);

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;

    // Mock process.exit to throw to stop execution (mimicking real behavior)
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  describe('login command', () => {
    it('should login successfully with valid credentials', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(null);
      vi.mocked(promptsModule.promptForLogin).mockResolvedValue({
        identifier: 'user.bsky.social',
        password: 'test-password',
      });
      mockClient.login.mockResolvedValue(mockSessionData);

      const auth = createAuthCommand();
      await auth.parseAsync(['node', 'test', 'login', '--app-password']);

      expect(promptsModule.promptForLogin).toHaveBeenCalled();
      expect(mockClient.login).toHaveBeenCalledWith('user.bsky.social', 'test-password');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully logged in'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`@${mockSessionData.handle}`)
      );
    });

    it('should prevent login when already authenticated', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(mockSessionMetadata);

      const auth = createAuthCommand();
      await expect(auth.parseAsync(['node', 'test', 'login'])).rejects.toThrow('process.exit');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Already logged in'));
      expect(promptsModule.promptForLogin).not.toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should handle login errors gracefully', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(null);
      vi.mocked(promptsModule.promptForLogin).mockResolvedValue({
        identifier: 'user.bsky.social',
        password: 'wrong-password',
      });
      mockClient.login.mockRejectedValue(new Error('Invalid credentials'));

      const auth = createAuthCommand();
      await expect(auth.parseAsync(['node', 'test', 'login', '--app-password'])).rejects.toThrow(
        'process.exit(1)'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Login failed'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid credentials'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('logout command', () => {
    it('should logout successfully when authenticated', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(mockSessionMetadata);
      mockClient.logout.mockResolvedValue(undefined);

      const auth = createAuthCommand();
      await auth.parseAsync(['node', 'test', 'logout']);

      expect(mockClient.logout).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Logged out'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`@${mockSessionMetadata.handle}`)
      );
    });

    it('should handle logout when not authenticated', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(null);

      const auth = createAuthCommand();
      await expect(auth.parseAsync(['node', 'test', 'logout'])).rejects.toThrow('process.exit');

      expect(mockClient.logout).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Not currently logged in');
      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(mockSessionMetadata);
      mockClient.logout.mockRejectedValue(new Error('Logout failed'));

      const auth = createAuthCommand();
      await expect(auth.parseAsync(['node', 'test', 'logout'])).rejects.toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Logout failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('status command', () => {
    it('should show authenticated status with session details', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(mockSessionMetadata);

      const auth = createAuthCommand();
      await auth.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Authenticated'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`@${mockSessionMetadata.handle}`)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(mockSessionMetadata.did));
    });

    it('should show not authenticated status', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(null);

      const auth = createAuthCommand();
      await auth.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Not authenticated'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('tang auth login'));
    });

    it('should handle status check errors gracefully', async () => {
      vi.mocked(sessionModule.getCurrentSessionMetadata).mockRejectedValue(
        new Error('Failed to read session')
      );

      const auth = createAuthCommand();
      await expect(auth.parseAsync(['node', 'test', 'status'])).rejects.toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to check status')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
