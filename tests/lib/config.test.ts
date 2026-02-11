import { homedir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLocalRemote,
  clearUserRemote,
  getConfiguredRemote,
  loadConfig,
  setLocalRemote,
  setUserRemote,
} from '../../src/lib/config.js';

// Mock modules
vi.mock('node:fs/promises');
vi.mock('simple-git');
vi.mock('cosmiconfig');

// Import mocked modules
import * as fs from 'node:fs/promises';
import { cosmiconfig } from 'cosmiconfig';
import { simpleGit } from 'simple-git';

describe('Config Management', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env.TANGLED_REMOTE;
    delete process.env.TANGLED_REMOTE;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.TANGLED_REMOTE = originalEnv;
    } else {
      delete process.env.TANGLED_REMOTE;
    }
  });

  describe('loadConfig', () => {
    it('should return config from TANGLED_REMOTE environment variable', async () => {
      process.env.TANGLED_REMOTE = 'upstream';

      const config = await loadConfig();

      expect(config).toEqual({ remote: 'upstream' });
    });

    it('should load config from file when env var not set', async () => {
      const mockExplorer = {
        search: vi.fn().mockResolvedValue({
          config: { remote: 'origin' },
          filepath: '/test/.tangledrc',
          isEmpty: false,
        }),
      };

      vi.mocked(cosmiconfig).mockReturnValue(mockExplorer as never);

      // Mock Git root
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const config = await loadConfig('/test/repo');

      expect(config).toEqual({ remote: 'origin' });
      expect(mockExplorer.search).toHaveBeenCalledWith('/test/repo');
    });

    it('should return empty config when no config file found', async () => {
      const mockExplorer = {
        search: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(cosmiconfig).mockReturnValue(mockExplorer as never);

      // Mock Git root
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const config = await loadConfig();

      expect(config).toEqual({});
    });

    it('should handle cosmiconfig errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockExplorer = {
        search: vi.fn().mockRejectedValue(new Error('Config read error')),
      };

      vi.mocked(cosmiconfig).mockReturnValue(mockExplorer as never);

      // Mock Git root
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const config = await loadConfig();

      expect(config).toEqual({});
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load config'));

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getConfiguredRemote', () => {
    it('should return remote name from config', async () => {
      process.env.TANGLED_REMOTE = 'upstream';

      const remote = await getConfiguredRemote();

      expect(remote).toBe('upstream');
    });

    it('should return null when no config found', async () => {
      const mockExplorer = {
        search: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(cosmiconfig).mockReturnValue(mockExplorer as never);

      // Mock not in Git repo
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const remote = await getConfiguredRemote();

      expect(remote).toBeNull();
    });
  });

  describe('setLocalRemote', () => {
    it('should write config to Git root directory', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await setLocalRemote('origin', '/test/repo');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/repo/.tangledrc',
        `${JSON.stringify({ remote: 'origin' }, null, 2)}\n`,
        'utf-8'
      );
    });

    it('should throw error when not in Git repository', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      await expect(setLocalRemote('origin')).rejects.toThrow('Not in a Git repository');
    });

    it('should throw error on write failure', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));

      await expect(setLocalRemote('origin')).rejects.toThrow('Failed to write local config');
    });
  });

  describe('setUserRemote', () => {
    it('should write config to user home directory', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await setUserRemote('origin');

      const expectedPath = join(homedir(), '.tangledrc');
      expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        `${JSON.stringify({ remote: 'origin' }, null, 2)}\n`,
        'utf-8'
      );
    });

    it('should throw error on write failure', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));

      await expect(setUserRemote('origin')).rejects.toThrow('Failed to write user config');
    });
  });

  describe('clearLocalRemote', () => {
    it('should delete local config file', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await clearLocalRemote('/test/repo');

      expect(fs.unlink).toHaveBeenCalledWith('/test/repo/.tangledrc');
    });

    it('should not throw error if file does not exist', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.unlink).mockRejectedValue(error);

      await expect(clearLocalRemote()).resolves.not.toThrow();
    });

    it('should throw error when not in Git repository', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      await expect(clearLocalRemote()).rejects.toThrow('Not in a Git repository');
    });
  });

  describe('clearUserRemote', () => {
    it('should delete user config file', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await clearUserRemote();

      const expectedPath = join(homedir(), '.tangledrc');
      expect(fs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should not throw error if file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.unlink).mockRejectedValue(error);

      await expect(clearUserRemote()).resolves.not.toThrow();
    });
  });
});
