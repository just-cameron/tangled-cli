import { Command } from 'commander';
import { listAllIssues, resolveEntityAddress, sortIssues } from '../lib/addressing.js';
import { createApiClient } from '../lib/api-client.js';
import { getCurrentRepoContext } from '../lib/context.js';
import type { IssueData } from '../lib/issues-api.js';
import {
  closeIssue,
  createIssue,
  getCompleteIssueData,
  getIssueState,
  listIssues,
  reopenIssue,
  resolveSequentialNumber,
  updateIssue,
} from '../lib/issues-api.js';
import { resolveRepositoryDid } from '../lib/repository.js';
import { requestedFields, wantsJson } from '../lib/runtime.js';
import { ensureAuthenticated } from '../utils/auth-helpers.js';
import { readBodyInput } from '../utils/body-input.js';
import { formatDate, formatIssueState, outputJson } from '../utils/formatting.js';
import { validateIssueBody, validateIssueTitle } from '../utils/validation.js';

/**
 * Extract rkey from AT-URI
 */
function extractRkey(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1] || 'unknown';
}

/** Aliases for local-scan matching of legacy/buggy `.repo` values. */
function repoAliasesFor(context: { owner: string; name: string }): string[] {
  return Array.from(
    new Set([context.owner, context.name].filter((v) => typeof v === 'string' && v.length > 0))
  );
}

/**
 * Resolve issue number or rkey to full AT-URI
 * @param input - User input: number ("1"), hash ("#1"), or rkey ("3mef...")
 * @param client - API client
 * @param repoDid - Repository DID
 * @returns Object with full issue AT-URI and display identifier
 */
async function resolveIssueUri(
  input: string,
  client: ReturnType<typeof createApiClient>,
  repoDid: string,
  repoAliases: string[] = []
): Promise<{ uri: string; displayId: string; warning?: string }> {
  const resolution = await resolveEntityAddress({
    kind: 'issue',
    input,
    client,
    repoDid,
    repoAliases,
  });
  return {
    uri: resolution.uri,
    displayId:
      resolution.computedNumber !== undefined ? `#${resolution.computedNumber}` : resolution.rkey,
    warning: resolution.warning,
  };
}

/**
 * A custom subclass of Command with support for adding the common issue JSON flag.
 */
class IssueCommand extends Command {
  addIssueJsonOption() {
    return this.option(
      '--json [fields]',
      'Output JSON; optionally specify comma-separated fields (number, title, body, state, author, createdAt, uri, cid)'
    );
  }
}

/**
 * Issue view subcommand
 */
function createViewCommand(): Command {
  return new IssueCommand('view')
    .description('View details of a specific issue')
    .argument('<issue-id>', 'Issue number (e.g., 1, #2) or rkey')
    .addIssueJsonOption()
    .action(async (issueId: string, options: { json?: string | true }) => {
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
        const repoAliases = repoAliasesFor(context);

        // 4. Resolve issue ID to URI
        const { uri: issueUri, displayId } = await resolveIssueUri(
          issueId,
          client,
          repoDid,
          repoAliases
        );

        // 5. Fetch complete issue data (record, sequential number, state)
        const issueData = await getCompleteIssueData(client, issueUri, displayId, repoDid);

        // 6. Output result
        if (wantsJson(options.json)) {
          outputJson(issueData, requestedFields(options.json));
          return;
        }

        console.log(`\nIssue ${displayId} ${formatIssueState(issueData.state)}`);
        console.log(`Title: ${issueData.title}`);
        console.log(`Author: ${issueData.author}`);
        console.log(`Created: ${formatDate(issueData.createdAt)}`);
        console.log(`Repo: ${context.name}`);
        console.log(`URI: ${issueData.uri}`);

        if (issueData.body) {
          console.log('\nBody:');
          console.log(issueData.body);
        }

        console.log(); // Empty line at end
      } catch (error) {
        console.error(
          `✗ Failed to view issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });
}

/**
 * Issue edit subcommand
 */
function createEditCommand(): Command {
  return new IssueCommand('edit')
    .description('Edit an issue title and/or body')
    .argument('<issue-id>', 'Issue number or rkey')
    .option('-t, --title <string>', 'New issue title')
    .option('-b, --body <string>', 'New issue body text')
    .option('-F, --body-file <path>', 'Read body from file (- for stdin)')
    .addIssueJsonOption()
    .action(
      async (
        issueId: string,
        options: { title?: string; body?: string; bodyFile?: string; json?: string | true }
      ) => {
        try {
          // 1. Validate at least one option provided
          if (!options.title && !options.body && !options.bodyFile) {
            console.error('✗ At least one of --title, --body, or --body-file must be provided');
            process.exit(1);
          }

          // 2. Validate auth
          const client = createApiClient();
          await ensureAuthenticated(client);

          // 3. Get repo context
          const context = await getCurrentRepoContext();
          if (!context) {
            console.error('✗ Not in a Tangled repository');
            console.error('\nTo use this repository with Tangled, add a remote:');
            console.error('  git remote add origin git@tangled.org:<did>/<repo>.git');
            process.exit(1);
          }

          // 4. Resolve repo DID
          const repoDid = await resolveRepositoryDid(context, client);
          const repoAliases = repoAliasesFor(context);

          // 5. Resolve issue ID to URI
          const { uri: issueUri, displayId } = await resolveIssueUri(
            issueId,
            client,
            repoDid,
            repoAliases
          );

          // 6. Handle body input
          const body = await readBodyInput(options.body, options.bodyFile);

          // 7. Validate inputs
          const validTitle = options.title ? validateIssueTitle(options.title) : undefined;
          const validBody = body !== undefined ? validateIssueBody(body) : undefined;

          // 8. Update issue
          const updatedIssue = await updateIssue({
            client,
            issueUri,
            title: validTitle,
            body: validBody,
          });

          // 9. Output result
          if (wantsJson(options.json)) {
            const [number, state] = await Promise.all([
              resolveSequentialNumber(displayId, updatedIssue.uri, client, repoDid),
              getIssueState({ client, issueUri: updatedIssue.uri }),
            ]);
            const issueData: IssueData = {
              id: extractRkey(updatedIssue.uri),
              number,
              numberKind: number === undefined ? 'unknown' : 'computed',
              title: updatedIssue.title,
              body: updatedIssue.body,
              state,
              author: updatedIssue.author,
              createdAt: updatedIssue.createdAt,
              uri: updatedIssue.uri,
              cid: updatedIssue.cid,
            };
            outputJson(issueData, requestedFields(options.json));
            return;
          }

          const updated: string[] = [];
          if (validTitle !== undefined) updated.push('title');
          if (validBody !== undefined) updated.push('body');

          console.log(`✓ Issue ${displayId} updated`);
          console.log(`  Updated: ${updated.join(', ')}`);
        } catch (error) {
          console.error(
            `✗ Failed to edit issue: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      }
    );
}

/**
 * Issue close subcommand
 */
function createCloseCommand(): Command {
  return new IssueCommand('close')
    .description('Close an issue')
    .argument('<issue-id>', 'Issue number or rkey')
    .addIssueJsonOption()
    .action(async (issueId: string, options: { json?: string | true }) => {
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
        const repoAliases = repoAliasesFor(context);

        // 4. Resolve issue ID to URI
        const { uri: issueUri, displayId } = await resolveIssueUri(
          issueId,
          client,
          repoDid,
          repoAliases
        );

        // 5. Fetch complete issue data (state will be 'closed' after operation)
        const issueData = await getCompleteIssueData(
          client,
          issueUri,
          displayId,
          repoDid,
          'closed'
        );

        // 6. Close issue
        await closeIssue({ client, issueUri });

        // 7. Display success
        if (wantsJson(options.json)) {
          outputJson(issueData, requestedFields(options.json));
        } else {
          console.log(`✓ Issue ${displayId} closed`);
          console.log(`  Title: ${issueData.title}`);
        }
      } catch (error) {
        console.error(
          `✗ Failed to close issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });
}

/**
 * Issue reopen subcommand
 */
function createReopenCommand(): Command {
  return new IssueCommand('reopen')
    .description('Reopen a closed issue')
    .argument('<issue-id>', 'Issue number or rkey')
    .addIssueJsonOption()
    .action(async (issueId: string, options: { json?: string | true }) => {
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
        const repoAliases = repoAliasesFor(context);

        // 4. Resolve issue ID to URI
        const { uri: issueUri, displayId } = await resolveIssueUri(
          issueId,
          client,
          repoDid,
          repoAliases
        );

        // 5. Fetch complete issue data (state will be 'open' after operation)
        const issueData = await getCompleteIssueData(client, issueUri, displayId, repoDid, 'open');

        // 6. Reopen issue
        await reopenIssue({ client, issueUri });

        // 7. Display success
        if (wantsJson(options.json)) {
          outputJson(issueData, requestedFields(options.json));
        } else {
          console.log(`✓ Issue ${displayId} reopened`);
          console.log(`  Title: ${issueData.title}`);
        }
      } catch (error) {
        console.error(
          `✗ Failed to reopen issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });
}

/**
 * Create the issue command with all subcommands
 */
export function createIssueCommand(): Command {
  const issue = new Command('issue');
  issue.description('Manage issues in Tangled repositories');

  issue.addCommand(createCreateCommand());
  issue.addCommand(createListCommand());
  issue.addCommand(createViewCommand());
  issue.addCommand(createEditCommand());
  issue.addCommand(createCloseCommand());
  issue.addCommand(createReopenCommand());

  return issue;
}

/**
 * Issue create subcommand
 */
function createCreateCommand(): Command {
  return new IssueCommand('create')
    .description('Create a new issue')
    .argument('<title>', 'Issue title')
    .option('-b, --body <string>', 'Issue body text')
    .option('-F, --body-file <path>', 'Read body from file (- for stdin)')
    .addIssueJsonOption()
    .action(
      async (
        title: string,
        options: { body?: string; bodyFile?: string; json?: string | true }
      ) => {
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

          // 3. Validate title
          const validTitle = validateIssueTitle(title);

          // 4. Handle body input
          const body = await readBodyInput(options.body, options.bodyFile);
          if (body !== undefined) {
            validateIssueBody(body);
          }

          // 5. Resolve repo DID
          const repoDid = await resolveRepositoryDid(context, client);
          const repoAliases = repoAliasesFor(context);

          // 6. Create issue (suppress progress message in JSON mode)
          if (!wantsJson(options.json)) {
            console.log('Creating issue...');
          }
          const issue = await createIssue({
            client,
            repoDid,
            title: validTitle,
            body,
          });

          // 7. Compute sequential number
          const sortedAll = await listAllIssues(client, repoDid, repoAliases);
          const idx = sortedAll.findIndex((i) => i.uri === issue.uri);
          const number = idx >= 0 ? idx + 1 : undefined;

          // 8. Output result
          if (wantsJson(options.json)) {
            const issueData: IssueData = {
              id: extractRkey(issue.uri),
              number,
              numberKind: number === undefined ? 'unknown' : 'computed',
              title: issue.title,
              body: issue.body,
              state: 'open',
              author: issue.author,
              createdAt: issue.createdAt,
              uri: issue.uri,
              cid: issue.cid,
            };
            outputJson(issueData, requestedFields(options.json));
            return;
          }

          const displayNumber = number !== undefined ? `#${number}` : extractRkey(issue.uri);
          console.log(`\n✓ Issue ${displayNumber} created`);
          console.log(`  Title: ${issue.title}`);
          console.log(`  URI: ${issue.uri}`);
        } catch (error) {
          console.error(
            `✗ Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      }
    );
}

/**
 * Issue list subcommand
 */
function createListCommand(): Command {
  return new IssueCommand('list')
    .description('List issues for the current repository')
    .option('-l, --limit <number>', 'Maximum number of issues per page', '50')
    .option('--cursor <cursor>', 'Continue from a pagination cursor')
    .option('--all', 'Fetch every page')
    .addIssueJsonOption()
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
          const repoAliases = repoAliasesFor(context);

          // 4. Fetch issues
          const limit = Number.parseInt(options.limit, 10);
          if (Number.isNaN(limit) || limit < 1 || limit > 100) {
            console.error('✗ Invalid limit. Must be between 1 and 100.');
            process.exit(1);
          }

          const page = options.all
            ? { issues: await listAllIssues(client, repoDid, repoAliases), cursor: undefined }
            : await listIssues({
                client,
                repoDid,
                repoAliases,
                limit,
                cursor: options.cursor,
              });
          const { issues } = page;

          // 5. Handle empty results
          if (issues.length === 0) {
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
              console.log('No issues found for this repository.');
            }
            return;
          }

          // Sort issues by creation time (oldest first) for consistent numbering
          const sortedIssues = sortIssues(issues);

          // Build issue data with states (in parallel for performance)
          const issueData = await Promise.all(
            sortedIssues.map(async (issue, i) => {
              const state = await getIssueState({ client, issueUri: issue.uri });
              return {
                id: extractRkey(issue.uri),
                number: options.all || !options.cursor ? i + 1 : undefined,
                numberKind:
                  options.all || !options.cursor ? ('computed' as const) : ('unknown' as const),
                title: issue.title,
                body: issue.body,
                state,
                author: issue.author,
                createdAt: issue.createdAt,
                uri: issue.uri,
                cid: issue.cid,
              };
            })
          );

          // 6. Output results
          if (wantsJson(options.json)) {
            outputJson(
              {
                items: issueData,
                count: issueData.length,
                nextCursor: page.cursor,
                addressing:
                  'Use id or uri for durable automation; numbers are computed display order.',
              },
              requestedFields(options.json)
            );
            return;
          }

          console.log(`\nFound ${issueData.length} issue${issueData.length === 1 ? '' : 's'}:\n`);

          for (const item of issueData) {
            const stateBadge = formatIssueState(item.state);
            const date = formatDate(item.createdAt);
            const address = item.number === undefined ? item.id : `#${item.number}`;
            console.log(`  ${address}  ${stateBadge}  ${item.title}`);
            console.log(`              Created ${date}`);
            console.log();
          }
          if (page.cursor) console.log(`Next cursor: ${page.cursor}`);
        } catch (error) {
          console.error(
            `✗ Failed to list issues: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      }
    );
}
