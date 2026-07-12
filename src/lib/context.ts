/**
 * Repository context resolution for Tangled CLI
 * Automatically infers repository context from Git remotes
 */

import { simpleGit } from 'simple-git';
import { isTangledRemote, parseTangledRemote } from '../utils/git.js';
import { promptForRemoteSelection, promptToSaveRemote } from '../utils/prompts.js';
import { getConfiguredRemote, setLocalRemote } from './config.js';
import { getRuntimeOptions } from './runtime.js';

export interface RepositoryContext {
  owner: string; // Owner identifier - DID (e.g., "did:plc:...") or handle (e.g., "alice.bsky.social")
  ownerType: 'did' | 'handle'; // Type of owner identifier
  name: string; // Repository name (e.g., "tangled-cli")
  remoteName: string; // Git remote name (e.g., "origin")
  remoteUrl: string; // Full remote URL
  protocol: 'ssh' | 'https'; // Protocol used by remote
  repoAtUri?: string; // Repository record AT-URI when supplied explicitly
  repoDid?: string; // Stable repository DID when already known
  publicUrl?: string; // Canonical-ish public repository URL
  selectionSource?: 'flag' | 'environment' | 'git';
}

const REPO_ROUTE_SEGMENTS = new Set([
  'issues',
  'pulls',
  'pipelines',
  'labels',
  'tree',
  'blob',
  'commits',
  'settings',
]);

/**
 * Parse a repository selector without consulting Git or scraping a web page.
 * Accepted forms include owner/name, Tangled URLs, repository AT-URIs, Tangled
 * Git remotes, and a stable repository DID.
 */
export function parseRepositoryInput(
  input: string,
  source: 'flag' | 'environment' = 'flag'
): RepositoryContext {
  const raw = input.trim();
  if (!raw) throw new Error('Repository selector cannot be empty');

  const atUri = raw.match(/^at:\/\/(did:[^/]+)\/sh\.tangled\.repo\/([^/?#]+)$/);
  if (atUri) {
    const [, owner, name] = atUri;
    return {
      owner,
      ownerType: 'did',
      name,
      remoteName: '<explicit>',
      remoteUrl: raw,
      protocol: 'https',
      repoAtUri: raw,
      publicUrl: `https://tangled.org/${owner}/${name}`,
      selectionSource: source,
    };
  }

  const parsedRemote = parseTangledRemote(raw);
  if (parsedRemote) {
    return {
      ...parsedRemote,
      remoteName: '<explicit>',
      remoteUrl: raw,
      ...(parsedRemote.owner === parsedRemote.name && { repoDid: parsedRemote.owner }),
      publicUrl:
        parsedRemote.owner === parsedRemote.name
          ? undefined
          : `https://tangled.org/${parsedRemote.owner}/${parsedRemote.name}`,
      selectionSource: source,
    };
  }

  if (/^https?:\/\//.test(raw)) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new Error(`Invalid repository URL: ${raw}`);
    }
    if (url.hostname !== 'tangled.org' && url.hostname !== 'tangled.sh') {
      throw new Error(`Unsupported repository host: ${url.hostname}`);
    }
    const parts = url.pathname
      .split('/')
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));
    if (parts[0]?.startsWith('@')) parts[0] = parts[0].slice(1);
    const routeIndex = parts.findIndex((part) => REPO_ROUTE_SEGMENTS.has(part));
    const repoParts = routeIndex >= 0 ? parts.slice(0, routeIndex) : parts;
    if (repoParts.length < 2) throw new Error(`Repository URL is missing owner/name: ${raw}`);
    const [owner, name] = repoParts;
    return {
      owner,
      ownerType: owner.startsWith('did:') ? 'did' : 'handle',
      name: name.replace(/\.git$/, ''),
      remoteName: '<explicit>',
      remoteUrl: raw,
      protocol: 'https',
      publicUrl: `https://tangled.org/${owner}/${name.replace(/\.git$/, '')}`,
      selectionSource: source,
    };
  }

  if (/^did:[a-z]+:[A-Za-z0-9._:%-]+$/.test(raw)) {
    return {
      owner: raw,
      ownerType: 'did',
      name: raw,
      remoteName: '<explicit>',
      remoteUrl: raw,
      protocol: 'https',
      repoDid: raw,
      selectionSource: source,
    };
  }

  const normalized = raw
    .replace(/^@/, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');
  const parts = normalized.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    const [owner, name] = parts;
    return {
      owner,
      ownerType: owner.startsWith('did:') ? 'did' : 'handle',
      name,
      remoteName: '<explicit>',
      remoteUrl: raw,
      protocol: 'https',
      publicUrl: `https://tangled.org/${owner}/${name}`,
      selectionSource: source,
    };
  }

  throw new Error(
    `Invalid repository selector '${raw}'. Use OWNER/NAME, a Tangled URL, repository DID, or repository AT-URI.`
  );
}

/**
 * Get all tangled.org remotes from the current Git repository
 *
 * @param cwd - Current working directory
 * @returns Array of repository contexts
 */
export async function getTangledRemotes(cwd: string = process.cwd()): Promise<RepositoryContext[]> {
  try {
    const git = simpleGit(cwd);

    // Check if in a Git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return [];
    }

    // Get all remotes with URLs
    const remotes = await git.getRemotes(true);

    // Filter and parse tangled.org remotes
    const tangledRemotes: RepositoryContext[] = [];

    for (const remote of remotes) {
      if (!remote.refs.fetch || !isTangledRemote(remote.refs.fetch)) {
        continue;
      }

      const parsed = parseTangledRemote(remote.refs.fetch);
      if (!parsed) {
        console.warn(`Warning: Invalid tangled.org remote URL: ${remote.refs.fetch}`);
        continue;
      }

      tangledRemotes.push({
        owner: parsed.owner,
        ownerType: parsed.ownerType,
        name: parsed.name,
        remoteName: remote.name,
        remoteUrl: remote.refs.fetch,
        protocol: parsed.protocol,
        ...(parsed.owner === parsed.name && { repoDid: parsed.owner }),
        ...(parsed.owner !== parsed.name && {
          publicUrl: `https://tangled.org/${parsed.owner}/${parsed.name}`,
        }),
        selectionSource: 'git',
      });
    }

    return tangledRemotes;
  } catch {
    // Git errors - return empty array
    return [];
  }
}

/**
 * Prompt user to select a remote when multiple tangled remotes exist
 *
 * @param remotes - Array of repository contexts
 * @returns Selected repository context
 */
export async function promptForRemote(remotes: RepositoryContext[]): Promise<RepositoryContext> {
  if (remotes.length === 0) {
    throw new Error('No remotes available to select from');
  }

  if (remotes.length === 1) {
    return remotes[0];
  }

  // Convert to format expected by prompt
  const remoteChoices = remotes.map((r) => ({
    name: r.remoteName,
    url: r.remoteUrl,
  }));

  const selectedName = await promptForRemoteSelection(remoteChoices);

  const selected = remotes.find((r) => r.remoteName === selectedName);
  if (!selected) {
    throw new Error(`Selected remote "${selectedName}" not found`);
  }

  return selected;
}

/**
 * Get repository context from the current working directory
 * Looks for Git remotes pointing to tangled.org
 *
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Repository context or null if not in a tangled repo
 */
export async function getCurrentRepoContext(
  cwd: string = process.cwd(),
  explicitRepo?: string
): Promise<RepositoryContext | null> {
  const runtime = getRuntimeOptions();
  const override = explicitRepo ?? runtime.repo ?? process.env.TANG_REPO;
  if (override) {
    return parseRepositoryInput(override, (explicitRepo ?? runtime.repo) ? 'flag' : 'environment');
  }

  // Get all tangled remotes
  const remotes = await getTangledRemotes(cwd);

  // No tangled remotes found
  if (remotes.length === 0) {
    return null;
  }

  // Single remote - use it
  if (remotes.length === 1) {
    return remotes[0];
  }

  // Multiple remotes - check config first
  const configuredRemote = await getConfiguredRemote(cwd);

  if (configuredRemote) {
    // Check if configured remote exists and is a tangled remote
    const matchingRemote = remotes.find((r) => r.remoteName === configuredRemote);

    if (matchingRemote) {
      return matchingRemote;
    }

    // Configured remote doesn't exist or isn't a tangled remote
    console.warn(
      `Warning: Configured remote "${configuredRemote}" not found or is not a tangled.org remote. Continuing with heuristics.`
    );
  }

  // Check for "origin" remote
  const originRemote = remotes.find((r) => r.remoteName === 'origin');
  if (originRemote) {
    return originRemote;
  }

  // Prompt user to select
  if (runtime.noInput) {
    throw new Error(
      'Multiple Tangled remotes found. Select one with --repo/-R or set TANG_REPO; prompting is disabled by --no-input.'
    );
  }
  const selected = await promptForRemote(remotes);

  // Ask if user wants to save selection
  const shouldSave = await promptToSaveRemote();
  if (shouldSave) {
    try {
      await setLocalRemote(selected.remoteName, cwd);
      console.log(`✓ Saved remote "${selected.remoteName}" to local config\n`);
    } catch (error) {
      console.warn(
        `Warning: Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Don't block command execution if config save fails
    }
  }

  return selected;
}
