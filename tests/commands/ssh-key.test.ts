import { execSync } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSshKeyCommand } from '../../src/commands/ssh-key.js';
import * as sessionModule from '../../src/lib/session.js';

vi.mock('node:child_process');
vi.mock('../../src/lib/session.js');

describe('SSH Key Commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;
  let processExitSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;

    // Mock process.exit to throw to stop execution
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  describe('verify command', () => {
    it('should parse DID from successful SSH response', async () => {
      // Mock successful SSH response with actual format from tangled.org
      const mockSshOutput =
        "Hi @did:plc:b2mcbcamkwyznc5fkplwlxbf! You've successfully authenticated.\n";

      vi.mocked(execSync).mockImplementation(() => {
        // ssh -T returns non-zero exit code even on success, throw with stderr
        const error = new Error('SSH command') as Error & { stderr: string };
        error.stderr = mockSshOutput;
        throw error;
      });

      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue(null);

      const sshKey = createSshKeyCommand();
      await sshKey.parseAsync(['node', 'test', 'verify']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SSH authentication successful')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('did:plc:b2mcbcamkwyznc5fkplwlxbf')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Your SSH setup is working correctly')
      );
    });

    it('should show handle when logged in user matches SSH DID', async () => {
      const mockDid = 'did:plc:b2mcbcamkwyznc5fkplwlxbf';
      const mockSshOutput = `Hi @${mockDid}! You've successfully authenticated.\n`;

      vi.mocked(execSync).mockImplementation(() => {
        const error = new Error('SSH command') as Error & { stderr: string };
        error.stderr = mockSshOutput;
        throw error;
      });

      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue({
        handle: 'user.bsky.social',
        did: mockDid,
        pds: 'https://bsky.social',
        lastUsed: new Date().toISOString(),
      });

      const sshKey = createSshKeyCommand();
      await sshKey.parseAsync(['node', 'test', 'verify']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('did:plc:b2mcbcamkwyznc5fkplwlxbf')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('@user.bsky.social'));
    });

    it('should not show handle when logged in user does not match SSH DID', async () => {
      const mockSshOutput =
        "Hi @did:plc:b2mcbcamkwyznc5fkplwlxbf! You've successfully authenticated.\n";

      vi.mocked(execSync).mockImplementation(() => {
        const error = new Error('SSH command') as Error & { stderr: string };
        error.stderr = mockSshOutput;
        throw error;
      });

      vi.mocked(sessionModule.getCurrentSessionMetadata).mockResolvedValue({
        handle: 'otheruser.bsky.social',
        did: 'did:plc:differentuser',
        pds: 'https://bsky.social',
        lastUsed: new Date().toISOString(),
      });

      const sshKey = createSshKeyCommand();
      await sshKey.parseAsync(['node', 'test', 'verify']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('did:plc:b2mcbcamkwyznc5fkplwlxbf')
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('@otheruser.bsky.social')
      );
    });

    it('should handle SSH authentication failure', async () => {
      const mockSshOutput = 'Permission denied (publickey).\n';

      vi.mocked(execSync).mockImplementation(() => {
        const error = new Error('SSH command') as Error & { stderr: string };
        error.stderr = mockSshOutput;
        throw error;
      });

      const sshKey = createSshKeyCommand();
      await expect(sshKey.parseAsync(['node', 'test', 'verify'])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('SSH authentication failed')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not find authenticated DID')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should provide helpful error message on failure', async () => {
      const mockSshOutput = 'Connection refused';

      vi.mocked(execSync).mockImplementation(() => {
        const error = new Error('SSH command') as Error & { stderr: string };
        error.stderr = mockSshOutput;
        throw error;
      });

      const sshKey = createSshKeyCommand();
      await expect(sshKey.parseAsync(['node', 'test', 'verify'])).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Generated an SSH key'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('tangled.org/settings/keys')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('SSH agent is running'));
    });
  });
});
