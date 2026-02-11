import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { Command } from 'commander';
import { simpleGit } from 'simple-git';
import { loadConfig, type TangledConfig } from '../lib/config.js';

/**
 * Get Git root directory
 */
async function getGitRoot(cwd: string = process.cwd()): Promise<string | null> {
  try {
    const git = simpleGit(cwd);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return null;
    }
    const root = await git.revparse(['--show-toplevel']);
    return root.trim();
  } catch {
    return null;
  }
}

/**
 * Set a config value
 */
async function setConfigValue(key: string, value: string, global: boolean): Promise<void> {
  const configPath = global
    ? join(homedir(), '.tangledrc')
    : join((await getGitRoot()) || process.cwd(), '.tangledrc');

  if (!global) {
    const gitRoot = await getGitRoot();
    if (!gitRoot) {
      throw new Error('Not in a Git repository. Use --global or run from a Git repository.');
    }
  }

  // Load existing config
  let config: TangledConfig = {};
  try {
    const content = await readFile(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch {
    // Config doesn't exist yet, start with empty object
  }

  // Set the value
  config[key as keyof TangledConfig] = value as never;

  // Write updated config
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
}

/**
 * Unset a config value
 */
async function unsetConfigValue(key: string, global: boolean): Promise<void> {
  const configPath = global
    ? join(homedir(), '.tangledrc')
    : join((await getGitRoot()) || process.cwd(), '.tangledrc');

  if (!global) {
    const gitRoot = await getGitRoot();
    if (!gitRoot) {
      throw new Error('Not in a Git repository. Use --global or run from a Git repository.');
    }
  }

  // Load existing config
  let config: TangledConfig = {};
  try {
    const content = await readFile(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch {
    // Config doesn't exist, nothing to unset
    return;
  }

  // Remove the key
  delete config[key as keyof TangledConfig];

  // If config is now empty, delete the file
  if (Object.keys(config).length === 0) {
    try {
      await unlink(configPath);
    } catch {
      // File might not exist
    }
  } else {
    // Write updated config
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
  }
}

/**
 * Available configuration keys with their descriptions
 */
const AVAILABLE_KEYS: Record<string, string> = {
  remote: 'Default Git remote to use when multiple tangled.org remotes exist',
};

/**
 * Create the config command for managing Tangled CLI configuration
 */
export function createConfigCommand(): Command {
  const config = new Command('config');
  config.description('Manage Tangled CLI configuration');

  // List available config keys
  config
    .command('list')
    .description('List all available configuration keys')
    .action(async () => {
      try {
        const cfg = await loadConfig();

        console.log('Available configuration keys:\n');
        for (const [key, description] of Object.entries(AVAILABLE_KEYS)) {
          const value = cfg[key as keyof TangledConfig];
          const status = value ? `"${value}"` : '(not set)';
          console.log(`  ${key}`);
          console.log(`    ${description}`);
          console.log(`    Current value: ${status}\n`);
        }
      } catch (error) {
        console.error(
          `Failed to list config: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  // Get current config
  config
    .command('get [key]')
    .description('Get configuration value (defaults to all)')
    .action(async (key?: string) => {
      try {
        const cfg = await loadConfig();

        if (!key) {
          // Show all config values
          const keys = Object.keys(cfg) as Array<keyof TangledConfig>;
          if (keys.length === 0) {
            console.log('No configuration set');
            return;
          }
          for (const k of keys) {
            console.log(`${k} = ${cfg[k] || '(not set)'}`);
          }
        } else {
          // Show specific key
          const value = cfg[key as keyof TangledConfig];
          console.log(`${key} = ${value || '(not set)'}`);
        }
      } catch (error) {
        console.error(
          `Failed to get config: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  // Set config value
  config
    .command('set <key> <value>')
    .option('-g, --global', 'Save to user config instead of local')
    .description('Set a configuration value')
    .action(async (key: string, value: string, options: { global?: boolean }) => {
      try {
        await setConfigValue(key, value, options.global ?? false);
        const scope = options.global ? 'user config (~/.tangledrc)' : 'local config (.tangledrc)';
        console.log(`✓ Set ${key} to "${value}" in ${scope}`);
      } catch (error) {
        console.error(
          `Failed to set config: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  // Unset config value
  config
    .command('unset <key>')
    .option('-g, --global', 'Clear from user config instead of local')
    .description('Clear a configuration value')
    .action(async (key: string, options: { global?: boolean }) => {
      try {
        await unsetConfigValue(key, options.global ?? false);
        const scope = options.global ? 'user config' : 'local config';
        console.log(`✓ Cleared ${key} from ${scope}`);
      } catch (error) {
        console.error(
          `Failed to clear config: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  return config;
}
