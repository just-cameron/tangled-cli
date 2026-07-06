import { promisify } from 'node:util';
import { gzip as gzipCallback } from 'node:zlib';
import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { simpleGit } from 'simple-git';
import { createApiClient } from '../lib/api-client.js';
import { getCurrentRepoContext } from '../lib/context.js';
import type { PullData } from '../lib/pulls-api.js';
import { createPull, getCompletePullData, getPullState, listPulls } from '../lib/pulls-api.js';
import { buildRepoAtUri } from '../utils/at-uri.js';
import { ensureAuthenticated } from '../utils/auth-helpers.js';
import { readBodyInput } from '../utils/body-input.js';
import { formatDate, outputJson } from '../utils/formatting.js';

const gzip = promisify(gzipCallback);

/**
 * Format pull request state as a badge
 */
function formatPullState(state: 'open' | 'closed' | 'merged'): string {
  switch (state) {
    case 'open':
      return '[OPEN]';
    case 'closed':
      return '[CLOSED]';
    case 'merged':
      return '[MERGED]';
  }
}

/**
 * Extract rkey from AT-URI
 */
function extractRkey(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1] || 'unknown';
}

/**
 * Resolve PR number or rkey to full AT-URI
 * @param input - User input: number ("1"), hash ("#1"), or rkey ("3mef...")
 * @param client - API client
 * @param repoAtUri - Repository AT-URI
 */
async function resolvePullUri(
  input: string,
  client: ReturnType<typeof createApiClient>,
  repoAtUri: string
): Promise<{ uri: string; displayId: string }> {
  // Strip # prefix if present
  const normalized = input.startsWith('#') ? input.slice(1) : input;

  // Check if numeric
  if (/^\d+$/.test(normalized)) {
    const num = Number.parseInt(normalized, 10);

    if (num < 1) {
      throw new Error('Pull request number must be greater than 0');
    }

    const { pulls } = await listPulls({
      client,
      repoAtUri,
      limit: 100,
    });

    // Sort by creation time (oldest first)
    const sorted = pulls.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const pull = sorted[num - 1];
    if (!pull) {
      throw new Error(`Pull request #${num} not found`);
    }

    return {
      uri: pull.uri,
      displayId: `#${num}`,
    };
  }

  // Accept a full pull AT-URI directly.
  if (normalized.startsWith('at://')) {
    return {
      uri: normalized,
      displayId: extractRkey(normalized),
    };
  }

  // Treat as rkey or unique rkey prefix. Pulls may be authored by a different DID,
  // so do not build at://<current-session-did>/... here; find the matching record
  // from the repository's pull backlinks instead.
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new Error(`Invalid pull request identifier: ${input}`);
  }

  const { pulls } = await listPulls({ client, repoAtUri, limit: 100 });
  const matches = pulls.filter((pull) => extractRkey(pull.uri).startsWith(normalized));
  if (matches.length === 0) {
    throw new Error(`Pull request '${input}' not found`);
  }
  if (matches.length > 1) {
    throw new Error(`Pull request identifier '${input}' is ambiguous`);
  }

  return {
    uri: matches[0].uri,
    displayId: extractRkey(matches[0].uri),
  };
}

/**
 * PR create subcommand
 */
function createCreateCommand(): Command {
  return new Command('create')
    .description('Create a new pull request')
    .argument('[title]', 'Pull request title (deprecated; prefer --title)')
    .option('-B, --base <branch>', 'Target branch to merge into', 'main')
    .option('-H, --head <branch>', 'Source branch with changes (default: current branch)')
    .option('-t, --title <title>', 'Pull request title')
    .option('-b, --body <string>', 'Pull request body text')
    .option('-F, --body-file <path>', 'Read body from file (- for stdin)')
    .option('--skip-behind-check', 'Skip the check for unmerged base branch commits')
    .option('--json [fields]', 'Output JSON; optionally specify comma-separated fields')
    .action(
      async (
        titleArg: string | undefined,
        options: {
          base: string;
          head?: string;
          title?: string;
          body?: string;
          bodyFile?: string;
          skipBehindCheck?: boolean;
          json?: string | true;
        }
      ) => {
        try {
          // 1. Validate auth
          const client = createApiClient();
          await ensureAuthenticated(client);

          const title = options.title ?? titleArg;
          if (!title) {
            console.error('✗ Missing required pull request title. Use --title <title>.');
            process.exit(1);
          }

          // 2. Get repo context
          const context = await getCurrentRepoContext();
          if (!context) {
            console.error('✗ Not in a Tangled repository');
            console.error('\nTo use this repository with Tangled, add a remote:');
            console.error('  git remote add origin git@tangled.org:<did>/<repo>.git');
            process.exit(1);
          }

          const cwd = process.cwd();
          const git = simpleGit(cwd);
          const baseBranch = options.base;

          // 3. Determine head branch
          const headBranch = options.head ?? (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();

          // 4. Get source SHA
          const sourceSha = (await git.revparse([headBranch])).trim();

          // 5. Behind-base check
          if (!options.skipBehindCheck) {
            const behindLog = await git.log([`${headBranch}..${baseBranch}`]);
            const behindCount = behindLog.total;
            if (behindCount > 0) {
              const msg = `Head branch '${headBranch}' is ${behindCount} commit(s) behind '${baseBranch}'.`;
              if (options.json !== undefined) {
                // Non-interactive: fail with error
                console.error(`✗ ${msg} Merge base into head first, or use --skip-behind-check.`);
                process.exit(1);
              } else {
                // Interactive: prompt user
                console.warn(`⚠ ${msg}`);
                const proceed = await confirm({
                  message: 'Proceed anyway?',
                  default: false,
                });
                if (!proceed) {
                  console.log('Aborted.');
                  process.exit(0);
                }
              }
            }
          }

          // 6. Generate patch
          const patchContent = await git.diff([`${baseBranch}..${headBranch}`]);
          if (!patchContent) {
            console.error(
              `✗ No diff found between '${baseBranch}' and '${headBranch}'. Branches may be identical.`
            );
            process.exit(1);
          }

          // 7. Gzip the patch
          const patchBuffer = await gzip(Buffer.from(patchContent, 'utf-8'));

          // 8. Handle body input
          const body = await readBodyInput(options.body, options.bodyFile);

          // 9. Build repo AT-URI
          const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

          // 10. Create pull request
          if (options.json === undefined) {
            console.log('Creating pull request...');
          }
          const pull = await createPull({
            client,
            repoAtUri,
            title,
            body,
            targetBranch: baseBranch,
            sourceBranch: headBranch,
            sourceSha,
            patchBuffer,
          });

          // 11. Compute sequential number
          const { pulls: allPulls } = await listPulls({ client, repoAtUri, limit: 100 });
          const sortedAll = allPulls.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const idx = sortedAll.findIndex((p) => p.uri === pull.uri);
          const number = idx >= 0 ? idx + 1 : undefined;

          // 12. Output result
          if (options.json !== undefined) {
            const pullData: PullData = {
              number,
              title: pull.title,
              body: pull.body,
              state: 'open',
              author: pull.author,
              createdAt: pull.createdAt,
              uri: pull.uri,
              cid: pull.cid,
              sourceBranch: pull.source?.branch,
              targetBranch: pull.target.branch,
            };
            outputJson(pullData, typeof options.json === 'string' ? options.json : undefined);
            return;
          }

          const displayNumber = number !== undefined ? `#${number}` : extractRkey(pull.uri);
          console.log(`\n✓ Pull request ${displayNumber} created`);
          console.log(`  Title: ${pull.title}`);
          console.log(`  ${headBranch} → ${baseBranch}`);
          console.log(`  URI: ${pull.uri}`);
        } catch (error) {
          console.error(
            `✗ Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      }
    );
}

/**
 * PR list subcommand
 */
function createListCommand(): Command {
  return new Command('list')
    .description('List pull requests for the current repository')
    .option('-l, --limit <number>', 'Maximum number of pull requests to fetch', '50')
    .option('--json [fields]', 'Output JSON; optionally specify comma-separated fields')
    .action(async (options: { limit: string; json?: string | true }) => {
      try {
        // 1. Validate auth
        const client = createApiClient();
        await ensureAuthenticated(client);

        // 2. Get repo context
        const context = await getCurrentRepoContext();
        if (!context) {
          console.error('✗ Not in a Tangled repository');
          console.error('\nTo use this repository with Tangled, add a remote:');
          console.error('  git remote add origin git@tangled.org:<did>/<repo>.git');
          process.exit(1);
        }

        // 3. Build repo AT-URI
        const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

        // 4. Fetch pull requests
        const limit = Number.parseInt(options.limit, 10);
        if (Number.isNaN(limit) || limit < 1 || limit > 100) {
          console.error('✗ Invalid limit. Must be between 1 and 100.');
          process.exit(1);
        }

        const { pulls } = await listPulls({
          client,
          repoAtUri,
          limit,
        });

        // 5. Handle empty results
        if (pulls.length === 0) {
          if (options.json !== undefined) {
            console.log('[]');
          } else {
            console.log('No pull requests found for this repository.');
          }
          return;
        }

        // Sort pull requests by creation time (oldest first) for consistent numbering
        const sortedPulls = pulls.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Build pull data with states (in parallel for performance)
        const pullData = await Promise.all(
          sortedPulls.map(async (pull, i) => {
            const state = await getPullState({ client, pullUri: pull.uri });
            return {
              number: i + 1,
              title: pull.title,
              body: pull.body,
              state,
              author: pull.author,
              createdAt: pull.createdAt,
              uri: pull.uri,
              cid: pull.cid,
              sourceBranch: pull.source?.branch,
              targetBranch: pull.target.branch,
            };
          })
        );

        // 6. Output results
        if (options.json !== undefined) {
          outputJson(pullData, typeof options.json === 'string' ? options.json : undefined);
          return;
        }

        console.log(
          `\nFound ${pullData.length} pull request${pullData.length === 1 ? '' : 's'}:\n`
        );

        for (const item of pullData) {
          const stateBadge = formatPullState(item.state);
          const date = formatDate(item.createdAt);
          const branches = item.sourceBranch
            ? `${item.sourceBranch} → ${item.targetBranch}`
            : item.targetBranch;
          console.log(`  #${item.number}  ${stateBadge}  ${item.title}`);
          console.log(`              ${branches}  ·  Created ${date}`);
          console.log();
        }
      } catch (error) {
        console.error(
          `✗ Failed to list pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });
}

/**
 * PR view subcommand
 */
function createViewCommand(): Command {
  return new Command('view')
    .description('View details of a specific pull request')
    .argument('<pr-id>', 'Pull request number (e.g., 1, #2) or rkey')
    .option('--json [fields]', 'Output JSON; optionally specify comma-separated fields')
    .action(async (prId: string, options: { json?: string | true }) => {
      try {
        // 1. Validate auth
        const client = createApiClient();
        await ensureAuthenticated(client);

        // 2. Get repo context
        const context = await getCurrentRepoContext();
        if (!context) {
          console.error('✗ Not in a Tangled repository');
          console.error('\nTo use this repository with Tangled, add a remote:');
          console.error('  git remote add origin git@tangled.org:<did>/<repo>.git');
          process.exit(1);
        }

        // 3. Build repo AT-URI
        const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

        // 4. Resolve PR ID to URI
        const { uri: pullUri, displayId } = await resolvePullUri(prId, client, repoAtUri);

        // 5. Fetch complete pull request data
        const pullData = await getCompletePullData(client, pullUri, displayId, repoAtUri);

        // 6. Output result
        if (options.json !== undefined) {
          outputJson(pullData, typeof options.json === 'string' ? options.json : undefined);
          return;
        }

        const branches = pullData.sourceBranch
          ? `${pullData.sourceBranch} → ${pullData.targetBranch}`
          : pullData.targetBranch;

        console.log(`\nPR ${displayId} ${formatPullState(pullData.state)}`);
        console.log(`Title: ${pullData.title}`);
        console.log(`Branches: ${branches}`);
        console.log(`Author: ${pullData.author}`);
        console.log(`Created: ${formatDate(pullData.createdAt)}`);
        console.log(`Repo: ${context.name}`);
        console.log(`URI: ${pullData.uri}`);

        if (pullData.body) {
          console.log('\nBody:');
          console.log(pullData.body);
        }

        console.log(); // Empty line at end
      } catch (error) {
        console.error(
          `✗ Failed to view pull request: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });
}

/**
 * Create the pr command with all subcommands
 */
export function createPrCommand(): Command {
  const pr = new Command('pr');
  pr.description('Manage pull requests in Tangled repositories');

  pr.addCommand(createCreateCommand());
  pr.addCommand(createListCommand());
  pr.addCommand(createViewCommand());

  return pr;
}
