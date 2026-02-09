import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RepositoryContext } from '../../src/lib/context.js';
import {
  getCurrentRepoContext,
  getTangledRemotes,
  promptForRemote,
} from '../../src/lib/context.js';

// Mock modules
vi.mock('simple-git');
vi.mock('../../src/lib/config.js');
vi.mock('../../src/utils/prompts.js');

// Import mocked modules
import { simpleGit } from 'simple-git';
import * as configModule from '../../src/lib/config.js';
import * as promptsModule from '../../src/utils/prompts.js';

describe('Context Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTangledRemotes', () => {
    it('should return empty array when not in a Git repository', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const remotes = await getTangledRemotes();

      expect(remotes).toEqual([]);
    });

    it('should return empty array when no tangled remotes exist', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi
          .fn()
          .mockResolvedValue([{ name: 'origin', refs: { fetch: 'git@github.com:user/repo.git' } }]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const remotes = await getTangledRemotes();

      expect(remotes).toEqual([]);
    });

    it('should parse SSH tangled remote', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'origin',
            refs: { fetch: 'git@tangled.org:did:plc:b2mcbcamkwyznc5fkplwlxbf/tangled-cli.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const remotes = await getTangledRemotes();

      expect(remotes).toEqual([
        {
          owner: 'did:plc:b2mcbcamkwyznc5fkplwlxbf',
          ownerType: 'did',
          name: 'tangled-cli',
          remoteName: 'origin',
          remoteUrl: 'git@tangled.org:did:plc:b2mcbcamkwyznc5fkplwlxbf/tangled-cli.git',
          protocol: 'ssh',
        },
      ]);
    });

    it('should parse HTTPS tangled remote', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'origin',
            refs: { fetch: 'https://tangled.org/markbennett.ca/tangled-cli' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const remotes = await getTangledRemotes();

      expect(remotes).toEqual([
        {
          owner: 'markbennett.ca',
          ownerType: 'handle',
          name: 'tangled-cli',
          remoteName: 'origin',
          remoteUrl: 'https://tangled.org/markbennett.ca/tangled-cli',
          protocol: 'https',
        },
      ]);
    });

    it('should parse multiple tangled remotes', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'origin',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
          {
            name: 'upstream',
            refs: { fetch: 'git@tangled.org:did:plc:xyz789/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const remotes = await getTangledRemotes();

      expect(remotes).toHaveLength(2);
      expect(remotes[0].remoteName).toBe('origin');
      expect(remotes[1].remoteName).toBe('upstream');
    });

    it('should skip invalid tangled remotes with warning', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'invalid',
            refs: { fetch: 'git@tangled.org:invalid' }, // Missing repo name
          },
          {
            name: 'valid',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const remotes = await getTangledRemotes();

      expect(remotes).toHaveLength(1);
      expect(remotes[0].remoteName).toBe('valid');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid tangled.org remote URL')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle Git errors gracefully', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockRejectedValue(new Error('Git error')),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const remotes = await getTangledRemotes();

      expect(remotes).toEqual([]);
    });
  });

  describe('promptForRemote', () => {
    it('should return single remote without prompting', async () => {
      const remote: RepositoryContext = {
        owner: 'did:plc:abc123',
        ownerType: 'did',
        name: 'repo',
        remoteName: 'origin',
        remoteUrl: 'git@tangled.org:did:plc:abc123/repo.git',
        protocol: 'ssh',
      };

      const result = await promptForRemote([remote]);

      expect(result).toBe(remote);
      expect(promptsModule.promptForRemoteSelection).not.toHaveBeenCalled();
    });

    it('should prompt when multiple remotes available', async () => {
      const remotes: RepositoryContext[] = [
        {
          owner: 'did:plc:abc123',
          ownerType: 'did',
          name: 'repo',
          remoteName: 'origin',
          remoteUrl: 'git@tangled.org:did:plc:abc123/repo.git',
          protocol: 'ssh',
        },
        {
          owner: 'did:plc:xyz789',
          ownerType: 'did',
          name: 'repo',
          remoteName: 'upstream',
          remoteUrl: 'git@tangled.org:did:plc:xyz789/repo.git',
          protocol: 'ssh',
        },
      ];

      vi.mocked(promptsModule.promptForRemoteSelection).mockResolvedValue('upstream');

      const result = await promptForRemote(remotes);

      expect(result.remoteName).toBe('upstream');
      expect(promptsModule.promptForRemoteSelection).toHaveBeenCalledWith([
        { name: 'origin', url: 'git@tangled.org:did:plc:abc123/repo.git' },
        { name: 'upstream', url: 'git@tangled.org:did:plc:xyz789/repo.git' },
      ]);
    });

    it('should throw error when no remotes provided', async () => {
      await expect(promptForRemote([])).rejects.toThrow('No remotes available to select from');
    });
  });

  describe('getCurrentRepoContext', () => {
    it('should return null when not in a Git repository', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const context = await getCurrentRepoContext();

      expect(context).toBeNull();
    });

    it('should return null when no tangled remotes exist', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi
          .fn()
          .mockResolvedValue([{ name: 'origin', refs: { fetch: 'git@github.com:user/repo.git' } }]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const context = await getCurrentRepoContext();

      expect(context).toBeNull();
    });

    it('should return single tangled remote', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'origin',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const context = await getCurrentRepoContext();

      expect(context).toEqual({
        owner: 'did:plc:abc123',
        ownerType: 'did',
        name: 'repo',
        remoteName: 'origin',
        remoteUrl: 'git@tangled.org:did:plc:abc123/repo.git',
        protocol: 'ssh',
      });
    });

    it('should use configured remote when multiple remotes exist', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'origin',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
          {
            name: 'upstream',
            refs: { fetch: 'git@tangled.org:did:plc:xyz789/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(configModule.getConfiguredRemote).mockResolvedValue('upstream');

      const context = await getCurrentRepoContext();

      expect(context?.remoteName).toBe('upstream');
    });

    it('should fall back to origin when config points to non-existent remote', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'origin',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
          {
            name: 'upstream',
            refs: { fetch: 'git@tangled.org:did:plc:xyz789/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(configModule.getConfiguredRemote).mockResolvedValue('nonexistent');

      const context = await getCurrentRepoContext();

      expect(context?.remoteName).toBe('origin');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configured remote "nonexistent" not found')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should prefer origin remote when no config set', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'upstream',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
          {
            name: 'origin',
            refs: { fetch: 'git@tangled.org:did:plc:xyz789/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(configModule.getConfiguredRemote).mockResolvedValue(null);

      const context = await getCurrentRepoContext();

      expect(context?.remoteName).toBe('origin');
    });

    it('should prompt when no origin and no config', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'upstream',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
          {
            name: 'fork',
            refs: { fetch: 'git@tangled.org:did:plc:xyz789/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(configModule.getConfiguredRemote).mockResolvedValue(null);
      vi.mocked(promptsModule.promptForRemoteSelection).mockResolvedValue('fork');
      vi.mocked(promptsModule.promptToSaveRemote).mockResolvedValue(false);

      const context = await getCurrentRepoContext();

      expect(context?.remoteName).toBe('fork');
      expect(promptsModule.promptForRemoteSelection).toHaveBeenCalled();
    });

    it('should save config when user confirms', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'upstream',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
          {
            name: 'fork',
            refs: { fetch: 'git@tangled.org:did:plc:xyz789/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(configModule.getConfiguredRemote).mockResolvedValue(null);
      vi.mocked(promptsModule.promptForRemoteSelection).mockResolvedValue('fork');
      vi.mocked(promptsModule.promptToSaveRemote).mockResolvedValue(true);
      vi.mocked(configModule.setLocalRemote).mockResolvedValue(undefined);

      const context = await getCurrentRepoContext();

      expect(context?.remoteName).toBe('fork');
      expect(configModule.setLocalRemote).toHaveBeenCalledWith('fork', process.cwd());
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Saved remote "fork"'));

      consoleLogSpy.mockRestore();
    });

    it('should continue even if saving config fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        getRemotes: vi.fn().mockResolvedValue([
          {
            name: 'upstream',
            refs: { fetch: 'git@tangled.org:did:plc:abc123/repo.git' },
          },
          {
            name: 'fork',
            refs: { fetch: 'git@tangled.org:did:plc:xyz789/repo.git' },
          },
        ]),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(configModule.getConfiguredRemote).mockResolvedValue(null);
      vi.mocked(promptsModule.promptForRemoteSelection).mockResolvedValue('upstream');
      vi.mocked(promptsModule.promptToSaveRemote).mockResolvedValue(true);
      vi.mocked(configModule.setLocalRemote).mockRejectedValue(new Error('Write failed'));

      const context = await getCurrentRepoContext();

      expect(context?.remoteName).toBe('upstream');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save config'));

      consoleWarnSpy.mockRestore();
    });
  });
});
