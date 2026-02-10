import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { createApiClient } from '../lib/api-client.js';
import type { TangledApiClient } from '../lib/api-client.js';
import { getCurrentRepoContext } from '../lib/context.js';
import {
  closeIssue,
  createIssue,
  deleteIssue,
  getIssue,
  getIssueState,
  listIssues,
  reopenIssue,
  updateIssue,
} from '../lib/issues-api.js';
import { buildRepoAtUri } from '../utils/at-uri.js';
import { requireAuth } from '../utils/auth-helpers.js';
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

/**
 * Resolve issue number or rkey to full AT-URI
 * @param input - User input: number ("1"), hash ("#1"), or rkey ("3mef...")
 * @param client - API client
 * @param repoAtUri - Repository AT-URI
 * @returns Object with full issue AT-URI and display identifier
 */
async function resolveIssueUri(
  input: string,
  client: TangledApiClient,
  repoAtUri: string
): Promise<{ uri: string; displayId: string }> {
  // Strip # prefix if present
  const normalized = input.startsWith('#') ? input.slice(1) : input;

  // Check if numeric
  if (/^\d+$/.test(normalized)) {
    const num = Number.parseInt(normalized, 10);

    if (num < 1) {
      throw new Error('Issue number must be greater than 0');
    }

    // Query all issues for this repo
    const { issues } = await listIssues({
      client,
      repoAtUri,
      limit: 100, // Adjust if needed for large repos
    });

    // Sort by creation time (oldest first)
    const sorted = issues.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Get issue at index (1-based numbering)
    const issue = sorted[num - 1];
    if (!issue) {
      throw new Error(`Issue #${num} not found`);
    }

    return {
      uri: issue.uri,
      displayId: `#${num}`,
    };
  }

  // Treat as rkey - validate and build URI
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new Error(`Invalid issue identifier: ${input}`);
  }

  const session = await requireAuth(client);
  return {
    uri: `at://${session.did}/sh.tangled.repo.issue/${normalized}`,
    displayId: normalized,
  };
}

/**
 * Resolve a sequential issue number from a displayId or by scanning the issue list.
 * Fast path: if displayId is "#N", return N directly.
 * Fallback: fetch all issues, sort oldest-first, return 1-based position.
 */
async function resolveSequentialNumber(
  displayId: string,
  issueUri: string,
  client: TangledApiClient,
  repoAtUri: string
): Promise<number | undefined> {
  const match = displayId.match(/^#(\d+)$/);
  if (match) return Number.parseInt(match[1], 10);

  const { issues } = await listIssues({ client, repoAtUri, limit: 100 });
  const sorted = issues.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const idx = sorted.findIndex((i) => i.uri === issueUri);
  return idx >= 0 ? idx + 1 : undefined;
}

/**
 * Issue view subcommand
 */
function createViewCommand(): Command {
  return new Command('view')
    .description('View details of a specific issue')
    .argument('<issue-id>', 'Issue number (e.g., 1, #2) or rkey')
    .option(
      '--json [fields]',
      'Output JSON; optionally specify comma-separated fields (title, body, state, author, createdAt, uri, cid)'
    )
    .action(async (issueId: string, options: { json?: string | true }) => {
      try {
        // 1. Validate auth
        const client = createApiClient();
        if (!(await client.resumeSession())) {
          console.error('✗ Not authenticated. Run "tangled auth login" first.');
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

        // 3. Build repo AT-URI
        const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

        // 4. Resolve issue ID to URI
        const { uri: issueUri, displayId } = await resolveIssueUri(issueId, client, repoAtUri);

        // 5. Fetch issue details
        const issue = await getIssue({ client, issueUri });

        // 6. Fetch issue state
        const state = await getIssueState({ client, issueUri: issue.uri });

        // 7. Output result
        if (options.json !== undefined) {
          const issueData = {
            title: issue.title,
            body: issue.body,
            state,
            author: issue.author,
            createdAt: issue.createdAt,
            uri: issue.uri,
            cid: issue.cid,
          };
          outputJson(issueData, typeof options.json === 'string' ? options.json : undefined);
          return;
        }

        console.log(`\nIssue ${displayId} ${formatIssueState(state)}`);
        console.log(`Title: ${issue.title}`);
        console.log(`Author: ${issue.author}`);
        console.log(`Created: ${formatDate(issue.createdAt)}`);
        console.log(`Repo: ${context.name}`);
        console.log(`URI: ${issue.uri}`);

        if (issue.body) {
          console.log('\nBody:');
          console.log(issue.body);
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
  return new Command('edit')
    .description('Edit an issue title and/or body')
    .argument('<issue-id>', 'Issue number or rkey')
    .option('-t, --title <string>', 'New issue title')
    .option('-b, --body <string>', 'New issue body text')
    .option('-F, --body-file <path>', 'Read body from file (- for stdin)')
    .option(
      '--json [fields]',
      'Output JSON of the updated issue; optionally specify comma-separated fields (title, body, author, createdAt, uri, cid)'
    )
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
          if (!(await client.resumeSession())) {
            console.error('✗ Not authenticated. Run "tangled auth login" first.');
            process.exit(1);
          }

          // 3. Get repo context
          const context = await getCurrentRepoContext();
          if (!context) {
            console.error('✗ Not in a Tangled repository');
            console.error('\nTo use this repository with Tangled, add a remote:');
            console.error('  git remote add origin git@tangled.org:<did>/<repo>.git');
            process.exit(1);
          }

          // 4. Build repo AT-URI
          const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

          // 5. Resolve issue ID to URI
          const { uri: issueUri, displayId } = await resolveIssueUri(issueId, client, repoAtUri);

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
          if (options.json !== undefined) {
            const issueData = {
              title: updatedIssue.title,
              body: updatedIssue.body,
              author: updatedIssue.author,
              createdAt: updatedIssue.createdAt,
              uri: updatedIssue.uri,
              cid: updatedIssue.cid,
            };
            outputJson(issueData, typeof options.json === 'string' ? options.json : undefined);
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
  return new Command('close')
    .description('Close an issue')
    .argument('<issue-id>', 'Issue number or rkey')
    .option(
      '--json [fields]',
      'Output JSON; optionally specify comma-separated fields (number, title, uri, state, cid)'
    )
    .action(async (issueId: string, options: { json?: string | true }) => {
      try {
        // 1. Validate auth
        const client = createApiClient();
        if (!(await client.resumeSession())) {
          console.error('✗ Not authenticated. Run "tangled auth login" first.');
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

        // 3. Build repo AT-URI
        const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

        // 4. Resolve issue ID to URI
        const { uri: issueUri, displayId } = await resolveIssueUri(issueId, client, repoAtUri);

        // 5. Fetch issue details and sequential number
        const issue = await getIssue({ client, issueUri });
        const number = await resolveSequentialNumber(displayId, issueUri, client, repoAtUri);

        // 6. Close issue
        await closeIssue({ client, issueUri });

        // 7. Display success
        if (options.json !== undefined) {
          outputJson(
            { number, title: issue.title, uri: issueUri, state: 'closed', cid: issue.cid },
            typeof options.json === 'string' ? options.json : undefined
          );
        } else {
          console.log(`✓ Issue ${displayId} closed`);
          console.log(`  Title: ${issue.title}`);
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
  return new Command('reopen')
    .description('Reopen a closed issue')
    .argument('<issue-id>', 'Issue number or rkey')
    .option(
      '--json [fields]',
      'Output JSON; optionally specify comma-separated fields (number, title, uri, state, cid)'
    )
    .action(async (issueId: string, options: { json?: string | true }) => {
      try {
        // 1. Validate auth
        const client = createApiClient();
        if (!(await client.resumeSession())) {
          console.error('✗ Not authenticated. Run "tangled auth login" first.');
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

        // 3. Build repo AT-URI
        const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

        // 4. Resolve issue ID to URI
        const { uri: issueUri, displayId } = await resolveIssueUri(issueId, client, repoAtUri);

        // 5. Fetch issue details and sequential number
        const issue = await getIssue({ client, issueUri });
        const number = await resolveSequentialNumber(displayId, issueUri, client, repoAtUri);

        // 6. Reopen issue
        await reopenIssue({ client, issueUri });

        // 7. Display success
        if (options.json !== undefined) {
          outputJson(
            { number, title: issue.title, uri: issueUri, state: 'open', cid: issue.cid },
            typeof options.json === 'string' ? options.json : undefined
          );
        } else {
          console.log(`✓ Issue ${displayId} reopened`);
          console.log(`  Title: ${issue.title}`);
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
 * Issue delete subcommand
 */
function createDeleteCommand(): Command {
  return new Command('delete')
    .description('Delete an issue permanently')
    .argument('<issue-id>', 'Issue number or rkey')
    .option('-f, --force', 'Skip confirmation prompt')
    .option(
      '--json [fields]',
      'Output JSON; optionally specify comma-separated fields (number, title, uri, cid)'
    )
    .action(async (issueId: string, options: { force?: boolean; json?: string | true }) => {
      // 1. Validate auth
      const client = createApiClient();
      if (!(await client.resumeSession())) {
        console.error('✗ Not authenticated. Run "tangled auth login" first.');
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

      // 3. Build repo AT-URI, resolve issue ID, and fetch issue details
      let issueUri: string;
      let displayId: string;
      let issueTitle: string;
      let issueCid: string;
      let issueNumber: number | undefined;
      try {
        const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);
        ({ uri: issueUri, displayId } = await resolveIssueUri(issueId, client, repoAtUri));
        const issue = await getIssue({ client, issueUri });
        issueTitle = issue.title;
        issueCid = issue.cid;
        issueNumber = await resolveSequentialNumber(displayId, issueUri, client, repoAtUri);
      } catch (error) {
        console.error(
          `✗ Failed to delete issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }

      // 4. Confirm deletion if not --force (outside try so process.exit(0) propagates cleanly)
      if (!options.force) {
        const confirmed = await confirm({
          message: `Are you sure you want to delete issue ${displayId} "${issueTitle}"? This cannot be undone.`,
          default: false,
        });

        if (!confirmed) {
          console.log('Deletion cancelled.');
          process.exit(0);
        }
      }

      // 5. Delete issue
      try {
        await deleteIssue({ client, issueUri });
        if (options.json !== undefined) {
          outputJson(
            { number: issueNumber, title: issueTitle, uri: issueUri, cid: issueCid },
            typeof options.json === 'string' ? options.json : undefined
          );
        } else {
          console.log(`✓ Issue ${displayId} deleted`);
          console.log(`  Title: ${issueTitle}`);
        }
      } catch (error) {
        console.error(
          `✗ Failed to delete issue: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  issue.addCommand(createDeleteCommand());

  return issue;
}

/**
 * Issue create subcommand
 */
function createCreateCommand(): Command {
  return new Command('create')
    .description('Create a new issue')
    .argument('<title>', 'Issue title')
    .option('-b, --body <string>', 'Issue body text')
    .option('-F, --body-file <path>', 'Read body from file (- for stdin)')
    .option(
      '--json [fields]',
      'Output JSON; optionally specify comma-separated fields (number, title, body, author, createdAt, uri, cid)'
    )
    .action(
      async (
        title: string,
        options: { body?: string; bodyFile?: string; json?: string | true }
      ) => {
        try {
          // 1. Validate auth
          const client = createApiClient();
          if (!(await client.resumeSession())) {
            console.error('✗ Not authenticated. Run "tangled auth login" first.');
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

          // 3. Validate title
          const validTitle = validateIssueTitle(title);

          // 4. Handle body input
          const body = await readBodyInput(options.body, options.bodyFile);
          if (body !== undefined) {
            validateIssueBody(body);
          }

          // 5. Build repo AT-URI
          const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

          // 6. Create issue (suppress progress message in JSON mode)
          if (options.json === undefined) {
            console.log('Creating issue...');
          }
          const issue = await createIssue({
            client,
            repoAtUri,
            title: validTitle,
            body,
          });

          // 7. Compute sequential number
          const { issues: allIssues } = await listIssues({ client, repoAtUri, limit: 100 });
          const sortedAll = allIssues.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const idx = sortedAll.findIndex((i) => i.uri === issue.uri);
          const number = idx >= 0 ? idx + 1 : undefined;

          // 8. Output result
          if (options.json !== undefined) {
            const issueData = {
              number,
              title: issue.title,
              body: issue.body,
              author: issue.author,
              createdAt: issue.createdAt,
              uri: issue.uri,
              cid: issue.cid,
            };
            outputJson(issueData, typeof options.json === 'string' ? options.json : undefined);
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
  return new Command('list')
    .description('List issues for the current repository')
    .option('-l, --limit <number>', 'Maximum number of issues to fetch', '50')
    .option(
      '--json [fields]',
      'Output JSON; optionally specify comma-separated fields (number, title, body, state, author, createdAt, uri, cid)'
    )
    .action(async (options: { limit: string; json?: string | true }) => {
      try {
        // 1. Validate auth
        const client = createApiClient();
        if (!(await client.resumeSession())) {
          console.error('✗ Not authenticated. Run "tangled auth login" first.');
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

        // 3. Build repo AT-URI
        const repoAtUri = await buildRepoAtUri(context.owner, context.name, client);

        // 4. Fetch issues
        const limit = Number.parseInt(options.limit, 10);
        if (Number.isNaN(limit) || limit < 1 || limit > 100) {
          console.error('✗ Invalid limit. Must be between 1 and 100.');
          process.exit(1);
        }

        const { issues } = await listIssues({
          client,
          repoAtUri,
          limit,
        });

        // 5. Handle empty results
        if (issues.length === 0) {
          if (options.json !== undefined) {
            console.log('[]');
          } else {
            console.log('No issues found for this repository.');
          }
          return;
        }

        // Sort issues by creation time (oldest first) for consistent numbering
        const sortedIssues = issues.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Build issue data with states (in parallel for performance)
        const issueData = await Promise.all(
          sortedIssues.map(async (issue, i) => {
            const state = await getIssueState({ client, issueUri: issue.uri });
            return {
              number: i + 1,
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
        if (options.json !== undefined) {
          outputJson(issueData, typeof options.json === 'string' ? options.json : undefined);
          return;
        }

        console.log(`\nFound ${issueData.length} issue${issueData.length === 1 ? '' : 's'}:\n`);

        for (const item of issueData) {
          const stateBadge = formatIssueState(item.state);
          const date = formatDate(item.createdAt);
          console.log(`  #${item.number}  ${stateBadge}  ${item.title}`);
          console.log(`              Created ${date}`);
          console.log();
        }
      } catch (error) {
        console.error(
          `✗ Failed to list issues: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });
}
