import { Command } from 'commander';
import { createApiClient } from '../lib/api-client.js';
import { getCurrentRepoContext } from '../lib/context.js';
import { createIssue, listIssues } from '../lib/issues-api.js';
import { buildRepoAtUri } from '../utils/at-uri.js';
import { readBodyInput } from '../utils/body-input.js';
import { formatDate } from '../utils/formatting.js';
import { validateIssueBody, validateIssueTitle } from '../utils/validation.js';

/**
 * Extract rkey from AT-URI
 */
function extractRkey(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1] || 'unknown';
}

/**
 * Create the issue command with all subcommands
 */
export function createIssueCommand(): Command {
  const issue = new Command('issue');
  issue.description('Manage issues in Tangled repositories');

  issue.addCommand(createCreateCommand());
  issue.addCommand(createListCommand());

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
    .action(async (title: string, options: { body?: string; bodyFile?: string }) => {
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

        // 6. Create issue
        console.log('Creating issue...');
        const issue = await createIssue({
          client,
          repoAtUri,
          title: validTitle,
          body,
        });

        // 7. Display success
        const rkey = extractRkey(issue.uri);
        console.log(`\n✓ Issue created: #${rkey}`);
        console.log(`  Title: ${issue.title}`);
        console.log(`  URI: ${issue.uri}`);
      } catch (error) {
        console.error(
          `✗ Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });
}

/**
 * Issue list subcommand
 */
function createListCommand(): Command {
  return new Command('list')
    .description('List issues for the current repository')
    .option('-l, --limit <number>', 'Maximum number of issues to fetch', '50')
    .action(async (options: { limit: string }) => {
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

        // 5. Display results
        if (issues.length === 0) {
          console.log('No issues found for this repository.');
          return;
        }

        console.log(`\nFound ${issues.length} issue${issues.length === 1 ? '' : 's'}:\n`);

        for (const issue of issues) {
          const rkey = extractRkey(issue.uri);
          const date = formatDate(issue.createdAt);
          console.log(`  #${rkey}  ${issue.title}`);
          console.log(`         Created ${date}`);
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
