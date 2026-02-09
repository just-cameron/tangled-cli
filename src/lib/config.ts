/**
 * Configuration management for Tangled CLI
 * Handles loading and saving configuration with proper precedence:
 * 1. TANGLED_REMOTE environment variable
 * 2. Local config (.tangledrc in current directory or Git root)
 * 3. User config (~/.tangledrc or ~/.config/tangled/config)
 * 4. System config (/etc/tangledrc)
 */

import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { cosmiconfig } from 'cosmiconfig';
import { simpleGit } from 'simple-git';

export interface TangledConfig {
  remote?: string;
}

const MODULE_NAME = 'tangled';

/**
 * Get the Git root directory for the current working directory
 * @param cwd - Current working directory
 * @returns Git root path or null if not in a Git repository
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
 * Load configuration with proper precedence
 * Checks: env var > local config > user config > system config
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Configuration object
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<TangledConfig> {
  // Check environment variable first
  if (process.env.TANGLED_REMOTE) {
    return { remote: process.env.TANGLED_REMOTE };
  }

  try {
    const explorer = cosmiconfig(MODULE_NAME);

    // For local config, search from Git root if in a Git repo
    const gitRoot = await getGitRoot(cwd);
    const searchFrom = gitRoot || cwd;

    const result = await explorer.search(searchFrom);

    if (result && !result.isEmpty) {
      return result.config as TangledConfig;
    }
  } catch (error) {
    // Log warning but continue with empty config
    console.warn(
      `Warning: Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return {};
}

/**
 * Get the configured remote name for the current context
 * Returns null if no config found
 * @param cwd - Current working directory
 * @returns Remote name or null
 */
export async function getConfiguredRemote(cwd: string = process.cwd()): Promise<string | null> {
  const config = await loadConfig(cwd);
  return config.remote || null;
}

/**
 * Set the remote name in local config (.tangledrc in Git root)
 * @param remoteName - Name of the remote to use
 * @param cwd - Current working directory
 */
export async function setLocalRemote(
  remoteName: string,
  cwd: string = process.cwd()
): Promise<void> {
  const gitRoot = await getGitRoot(cwd);

  if (!gitRoot) {
    throw new Error('Not in a Git repository. Cannot set local config.');
  }

  const configPath = join(gitRoot, '.tangledrc');
  const config: TangledConfig = { remote: remoteName };

  try {
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to write local config: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Set the remote name in user config (~/.tangledrc)
 * @param remoteName - Name of the remote to use
 */
export async function setUserRemote(remoteName: string): Promise<void> {
  const configPath = join(homedir(), '.tangledrc');
  const config: TangledConfig = { remote: remoteName };

  try {
    // Ensure directory exists
    await mkdir(dirname(configPath), { recursive: true });
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to write user config: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clear configured remote from local config
 * @param cwd - Current working directory
 */
export async function clearLocalRemote(cwd: string = process.cwd()): Promise<void> {
  const gitRoot = await getGitRoot(cwd);

  if (!gitRoot) {
    throw new Error('Not in a Git repository. Cannot clear local config.');
  }

  const configPath = join(gitRoot, '.tangledrc');

  try {
    await unlink(configPath);
  } catch (error) {
    // If file doesn't exist, that's fine
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new Error(
        `Failed to delete local config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Clear configured remote from user config
 */
export async function clearUserRemote(): Promise<void> {
  const configPath = join(homedir(), '.tangledrc');

  try {
    await unlink(configPath);
  } catch (error) {
    // If file doesn't exist, that's fine
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new Error(
        `Failed to delete user config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
