import { promisify } from 'node:util';
import { gzip as gzipCallback } from 'node:zlib';
import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { simpleGit } from 'simple-git';
import { listAllPulls, resolveEntityAddress, sortPulls } from '../lib/addressing.js';
import { createApiClient } from '../lib/api-client.js';
import { getCurrentRepoContext } from '../lib/context.js';
import type { PullData } from '../lib/pulls-api.js';
import {
  createPull,
  deletePull,
  getCompletePullData,
  getPullState,
  listPulls,
} from '../lib/pulls-api.js';
import { resolveRepositoryDid } from '../lib/repository.js';
import { confirmationGranted, inputAllowed, requestedFields, wantsJson } from '../lib/runtime.js';
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
 * @param repoDid - Repository DID
 */
async function resolvePullUri(
  input: string,
  client: ReturnType<typeof createApiClient>,
  repoDid: string
): Promise<{ uri: string; displayId: string }> {
  const resolution = await resolveEntityAddress({ kind: 'pull', input, client, repoDid });
  return {
    uri: resolution.uri,
    displayId:
      resolution.computedNumber !== undefined ? `#${resolution.computedNumber}` : resolution.rkey,
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

          // 4. Behind-base check
          if (!options.skipBehindCheck) {
            const behindLog = await git.log([`${headBranch}..${baseBranch}`]);
            const behindCount = behindLog.total;
            if (behindCount > 0) {
              const msg = `Head branch '${headBranch}' is ${behindCount} commit(s) behind '${baseBranch}'.`;
              if (wantsJson(options.json) || !inputAllowed()) {
                if (confirmationGranted()) {
                  console.warn(`⚠ ${msg} Proceeding because --yes was provided.`);
                } else {
                  // Non-interactive: fail with error
                  console.error(
                    `✗ ${msg} Merge base into head first, use --skip-behind-check, or pass --yes.`
                  );
                  process.exit(1);
                }
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

          // 5. Generate patch
          const patchContent = await git.diff([`${baseBranch}..${headBranch}`]);
          if (!patchContent) {
            console.error(
              `✗ No diff found between '${baseBranch}' and '${headBranch}'. Branches may be identical.`
            );
            process.exit(1);
          }

          // 6. Gzip the patch
          const patchBuffer = await gzip(Buffer.from(patchContent, 'utf-8'));

          // 7. Handle body input
          const body = await readBodyInput(options.body, options.bodyFile);

          // 8. Resolve repo DID
          const repoDid = await resolveRepositoryDid(context, client);

          // 9. Create pull request
          if (!wantsJson(options.json)) {
            console.log('Creating pull request...');
          }
          const pull = await createPull({
            client,
            repoDid,
            title,
            body,
            targetBranch: baseBranch,
            sourceBranch: headBranch,
            patchBuffer,
          });

          // 10. Compute sequential number
          const sortedAll = await listAllPulls(client, repoDid);
          const idx = sortedAll.findIndex((p) => p.uri === pull.uri);
          const number = idx >= 0 ? idx + 1 : undefined;

          // 12. Output result
          if (wantsJson(options.json)) {
            const pullData: PullData = {
              id: extractRkey(pull.uri),
              number,
              numberKind: number === undefined ? 'unknown' : 'computed',
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
            outputJson(pullData, requestedFields(options.json));
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
    .option('-l, --limit <number>', 'Maximum number of pull requests per page', '50')
    .option('--cursor <cursor>', 'Continue from a pagination cursor')
    .option('--all', 'Fetch every page')
    .option('--json [fields]', 'Output JSON; optionally specify comma-separated fields')
    .action(
      async (options: { limit: string; cursor?: string; all?: boolean; json?: string | true }) => {
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

          // 3. Resolve repo DID
          const repoDid = await resolveRepositoryDid(context, client);

          // 4. Fetch pull requests
          const limit = Number.parseInt(options.limit, 10);
          if (Number.isNaN(limit) || limit < 1 || limit > 100) {
            console.error('✗ Invalid limit. Must be between 1 and 100.');
            process.exit(1);
          }

          const page = options.all
            ? { pulls: await listAllPulls(client, repoDid), cursor: undefined }
            : await listPulls({
                client,
                repoDid,
                limit,
                cursor: options.cursor,
              });
          const { pulls } = page;

          // 5. Handle empty results
          if (pulls.length === 0) {
            if (wantsJson(options.json)) {
              outputJson(
                {
                  items: [],
                  count: 0,
                  nextCursor: page.cursor,
                  addressing:
                    'Use id or uri for durable automation; numbers are computed display order.',
                },
                requestedFields(options.json)
              );
            } else {
              console.log('No pull requests found for this repository.');
            }
            return;
          }

          // Sort pull requests by creation time (oldest first) for consistent numbering
          const sortedPulls = sortPulls(pulls);

          // Build pull data with states (in parallel for performance)
          const pullData = await Promise.all(
            sortedPulls.map(async (pull, i) => {
              const state = await getPullState({ client, pullUri: pull.uri });
              return {
                id: extractRkey(pull.uri),
                number: options.all || !options.cursor ? i + 1 : undefined,
                numberKind:
                  options.all || !options.cursor ? ('computed' as const) : ('unknown' as const),
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
          if (wantsJson(options.json)) {
            outputJson(
              {
                items: pullData,
                count: pullData.length,
                nextCursor: page.cursor,
                addressing:
                  'Use id or uri for durable automation; numbers are computed display order.',
              },
              requestedFields(options.json)
            );
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
            const address = item.number === undefined ? item.id : `#${item.number}`;
            console.log(`  ${address}  ${stateBadge}  ${item.title}`);
            console.log(`              ${branches}  ·  Created ${date}`);
            console.log();
          }
          if (page.cursor) console.log(`Next cursor: ${page.cursor}`);
        } catch (error) {
          console.error(
            `✗ Failed to list pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      }
    );
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

        // 3. Resolve repo DID
        const repoDid = await resolveRepositoryDid(context, client);

        // 4. Resolve PR ID to URI
        const { uri: pullUri, displayId } = await resolvePullUri(prId, client, repoDid);

        // 5. Fetch complete pull request data
        const pullData = await getCompletePullData(client, pullUri, displayId, repoDid);

        // 6. Output result
        if (wantsJson(options.json)) {
          outputJson(pullData, requestedFields(options.json));
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
 * PR delete subcommand
 */
function createDeleteCommand(): Command {
  return new Command('delete')
    .description('Delete a pull request you authored')
    .argument('<pr-id>', 'Pull request number (e.g., 1, #2) or rkey')
    .option('-y, --yes', 'Skip the confirmation prompt')
    .action(async (prId: string, options: { yes?: boolean }) => {
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

        // 3. Resolve repo DID
        const repoDid = await resolveRepositoryDid(context, client);

        // 4. Resolve PR ID to URI
        const { uri: pullUri, displayId } = await resolvePullUri(prId, client, repoDid);
        const pull = await getCompletePullData(client, pullUri, displayId, repoDid);

        // 5. Confirm
        if (!confirmationGranted(options.yes)) {
          if (!inputAllowed()) {
            throw new Error('Refusing to delete without --yes while --no-input is active');
          }
          const proceed = await confirm({
            message: `Delete pull request ${displayId} ("${pull.title}")? This cannot be undone.`,
            default: false,
          });
          if (!proceed) {
            console.log('Aborted.');
            return;
          }
        }

        // 6. Delete
        await deletePull({ client, pullUri });
        console.log(`✓ Pull request ${displayId} deleted`);
      } catch (error) {
        console.error(
          `✗ Failed to delete pull request: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  pr.addCommand(createDeleteCommand());

  return pr;
}
