import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConfigCommand } from '../../src/commands/config.js';

// Mock modules
vi.mock('node:fs/promises');
vi.mock('simple-git');
vi.mock('../../src/lib/config.js');

// Import mocked modules
import * as fs from 'node:fs/promises';
import { simpleGit } from 'simple-git';
import * as configModule from '../../src/lib/config.js';

describe('Config Command', () => {
  let consoleLogSpy: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as never;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) as never;

    // Mock process.exit to throw so tests don't actually exit
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    }) as never;
  });

  describe('list command', () => {
    it('should list all available config keys with descriptions', async () => {
      vi.mocked(configModule.loadConfig).mockResolvedValue({ remote: 'origin' });

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'list']);

      expect(consoleLogSpy).toHaveBeenCalledWith('Available configuration keys:\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('  remote');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Default Git remote to use')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Current value: "origin"')
      );
    });

    it('should show "(not set)" for unset keys', async () => {
      vi.mocked(configModule.loadConfig).mockResolvedValue({});

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'list']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Current value: (not set)')
      );
    });
  });

  describe('get command', () => {
    it('should show all config values when no key specified', async () => {
      vi.mocked(configModule.loadConfig).mockResolvedValue({ remote: 'origin' });

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'get']);

      expect(consoleLogSpy).toHaveBeenCalledWith('remote = origin');
    });

    it('should show "No configuration set" when config is empty', async () => {
      vi.mocked(configModule.loadConfig).mockResolvedValue({});

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'get']);

      expect(consoleLogSpy).toHaveBeenCalledWith('No configuration set');
    });

    it('should show specific key value', async () => {
      vi.mocked(configModule.loadConfig).mockResolvedValue({ remote: 'upstream' });

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'get', 'remote']);

      expect(consoleLogSpy).toHaveBeenCalledWith('remote = upstream');
    });

    it('should show "(not set)" for undefined key', async () => {
      vi.mocked(configModule.loadConfig).mockResolvedValue({});

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'get', 'remote']);

      expect(consoleLogSpy).toHaveBeenCalledWith('remote = (not set)');
    });
  });

  describe('set command', () => {
    it('should set local config value', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'set', 'remote', 'origin']);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/repo/.tangledrc',
        `${JSON.stringify({ remote: 'origin' }, null, 2)}\n`,
        'utf-8'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Set remote to "origin" in local config')
      );
    });

    it('should set global config value with --global flag', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'set', 'remote', 'origin', '--global']);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.tangledrc'),
        `${JSON.stringify({ remote: 'origin' }, null, 2)}\n`,
        'utf-8'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Set remote to "origin" in user config')
      );
    });

    it('should error when not in Git repo for local config', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);

      const config = createConfigCommand();
      await expect(config.parseAsync(['node', 'test', 'set', 'remote', 'origin'])).rejects.toThrow(
        'process.exit'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to set config'));
    });

    it('should preserve existing config values', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({ remote: 'origin', other: 'value' })
      );
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'set', 'remote', 'upstream']);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/repo/.tangledrc',
        `${JSON.stringify({ remote: 'upstream', other: 'value' }, null, 2)}\n`,
        'utf-8'
      );
    });
  });

  describe('unset command', () => {
    it('should unset local config value', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ remote: 'origin' }));
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'unset', 'remote']);

      expect(fs.unlink).toHaveBeenCalledWith('/test/repo/.tangledrc');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleared remote from local config')
      );
    });

    it('should unset global config value with --global flag', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ remote: 'origin' }));
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'unset', 'remote', '--global']);

      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('.tangledrc'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleared remote from user config')
      );
    });

    it('should delete config file when last key is removed', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ remote: 'origin' }));
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'unset', 'remote']);

      expect(fs.unlink).toHaveBeenCalledWith('/test/repo/.tangledrc');
    });

    it('should preserve other config values when unsetting one key', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({ remote: 'origin', other: 'value' })
      );
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'unset', 'remote']);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/repo/.tangledrc',
        `${JSON.stringify({ other: 'value' }, null, 2)}\n`,
        'utf-8'
      );
    });

    it('should handle unset when config does not exist', async () => {
      const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('/test/repo\n'),
      };
      vi.mocked(simpleGit).mockReturnValue(mockGit as never);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      const config = createConfigCommand();
      await config.parseAsync(['node', 'test', 'unset', 'remote']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleared remote from local config')
      );
    });
  });
});
