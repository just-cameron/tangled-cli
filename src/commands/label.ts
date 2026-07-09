import { Command } from 'commander';
import { createApiClient } from '../lib/api-client.js';
import { getCurrentRepoContext } from '../lib/context.js';
import { listIssues } from '../lib/issues-api.js';
import {
  applyLabelOp,
  getSubjectLabels,
  listLabelDefinitions,
} from '../lib/labels-api.js';
import { listPulls } from '../lib/pulls-api.js';
import { resolveRepoDid } from '../utils/at-uri.js';
import { ensureAuthenticated, requireAuth } from '../utils/auth-helpers.js';
import { outputJson } from '../utils/formatting.js';

type SubjectKind = 'issue' | 'pr';

/**
 * Resolve an issue or PR number/rkey to its AT-URI.
 */
async function resolveSubjectUri(
  kind: SubjectKind,
  input: string,
  client: ReturnType<typeof createApiClient>,
  repoDid: string,
  repoAliases: string[] = []
): Promise<{ uri: string; displayId: string }> {
  const normalized = input.startsWith('#') ? input.slice(1) : input;

  if (/^\d+$/.test(normalized)) {
    const num = Number.parseInt(normalized, 10);
    if (num < 1) {
      throw new Error(`${kind} number must be greater than 0`);
    }

    if (kind === 'issue') {
      const { issues } = await listIssues({ client, repoDid, repoAliases, limit: 100 });
      const sorted = issues.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const issue = sorted[num - 1];
      if (!issue) throw new Error(`Issue #${num} not found`);
      return { uri: issue.uri, displayId: `#${num}` };
    }

    const { pulls } = await listPulls({ client, repoDid, limit: 100 });
    const sorted = pulls.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const pull = sorted[num - 1];
    if (!pull) throw new Error(`PR #${num} not found`);
    return { uri: pull.uri, displayId: `#${num}` };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new Error(`Invalid ${kind} identifier: ${input}`);
  }

  const session = await requireAuth(client);
  const collection = kind === 'issue' ? 'sh.tangled.repo.issue' : 'sh.tangled.repo.pull';
  return {
    uri: `at://${session.did}/${collection}/${normalized}`,
    displayId: normalized,
  };
}

function parseKind(kind: string): SubjectKind {
  if (kind === 'issue' || kind === 'pr') return kind;
  throw new Error('Kind must be "issue" or "pr"');
}

/**
 * decision-required and decision-made are mutually exclusive.
 * Applying one removes the other.
 */
function decisionSwap(adding: string): string | undefined {
  const lower = adding.toLowerCase();
  if (lower === 'decision-required') return 'decision-made';
  if (lower === 'decision-made') return 'decision-required';
  return undefined;
}

async function withRepoContext() {
  const client = createApiClient();
  await ensureAuthenticated(client);
  const context = await getCurrentRepoContext();
  if (!context) {
    console.error('✗ Not in a Tangled repository');
    process.exit(1);
  }
  const repoDid = await resolveRepoDid(context.owner, context.name, client);
  // Stable DID remotes and older issue records may store aliases in `.repo`.
  const repoAliases = Array.from(
    new Set([context.owner, context.name].filter((v) => typeof v === 'string' && v.length > 0))
  );
  return { client, context, repoDid, repoAliases };
}

export function createLabelCommand(): Command {
  const label = new Command('label').description(
    'Manage labels on Tangled issues and pull requests'
  );

  label
    .command('defs')
    .description('List label definitions available to the authenticated user')
    .option('--did <did>', 'List definitions from this DID instead of the current user')
    .option('--json', 'Output JSON')
    .action(async (options: { did?: string; json?: boolean }) => {
      try {
        const client = createApiClient();
        await ensureAuthenticated(client);
        const defs = await listLabelDefinitions(client, options.did);
        if (options.json) {
          outputJson(defs);
          return;
        }
        if (defs.length === 0) {
          console.log('No label definitions found.');
          return;
        }
        console.log(`\nFound ${defs.length} label definition(s):\n`);
        for (const def of defs) {
          const color = def.color ? ` ${def.color}` : '';
          const scope = def.scope?.join(', ') ?? 'any';
          console.log(`  ${def.name}${color}`);
          console.log(`    scope: ${scope}`);
          console.log(`    uri: ${def.uri}`);
        }
        console.log();
      } catch (error) {
        console.error(
          `✗ Failed to list label definitions: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  label
    .command('list')
    .description('List labels currently applied to an issue or PR')
    .argument('<kind>', 'issue or pr')
    .argument('<id>', 'Issue/PR number or rkey')
    .option('--json', 'Output JSON')
    .action(async (kindArg: string, id: string, options: { json?: boolean }) => {
      try {
        const kind = parseKind(kindArg);
        const { client, repoDid, repoAliases } = await withRepoContext();
        const { uri, displayId } = await resolveSubjectUri(
          kind,
          id,
          client,
          repoDid,
          repoAliases
        );
        const labels = await getSubjectLabels(client, uri);

        if (options.json) {
          outputJson({ subject: uri, displayId, labels });
          return;
        }

        console.log(`\nLabels on ${kind} ${displayId}:`);
        if (labels.length === 0) {
          console.log('  (none)');
        } else {
          for (const applied of labels) {
            console.log(`  ${applied.name}`);
          }
        }
        console.log();
      } catch (error) {
        console.error(
          `✗ Failed to list labels: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  label
    .command('add')
    .description('Add a label to an issue or PR')
    .argument('<kind>', 'issue or pr')
    .argument('<id>', 'Issue/PR number or rkey')
    .argument('<name>', 'Label name (e.g. decision-required) or definition AT-URI')
    .option('--json', 'Output JSON')
    .action(async (kindArg: string, id: string, name: string, options: { json?: boolean }) => {
      try {
        const kind = parseKind(kindArg);
        const { client, context, repoDid, repoAliases } = await withRepoContext();
        const { uri, displayId } = await resolveSubjectUri(
          kind,
          id,
          client,
          repoDid,
          repoAliases
        );

        const remove = decisionSwap(name);
        const result = await applyLabelOp({
          client,
          subjectUri: uri,
          addNamesOrUris: [name],
          removeNamesOrUris: remove ? [remove] : [],
          searchDids: [context.owner],
        });

        if (options.json) {
          outputJson({ subject: uri, displayId, added: name, removed: remove, ...result });
          return;
        }

        console.log(`✓ Added label "${name}" to ${kind} ${displayId}`);
        if (remove) {
          console.log(`  (removed mutually exclusive "${remove}")`);
        }
      } catch (error) {
        console.error(
          `✗ Failed to add label: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  label
    .command('remove')
    .description('Remove a label from an issue or PR')
    .argument('<kind>', 'issue or pr')
    .argument('<id>', 'Issue/PR number or rkey')
    .argument('<name>', 'Label name or definition AT-URI')
    .option('--json', 'Output JSON')
    .action(async (kindArg: string, id: string, name: string, options: { json?: boolean }) => {
      try {
        const kind = parseKind(kindArg);
        const { client, context, repoDid, repoAliases } = await withRepoContext();
        const { uri, displayId } = await resolveSubjectUri(
          kind,
          id,
          client,
          repoDid,
          repoAliases
        );

        const result = await applyLabelOp({
          client,
          subjectUri: uri,
          removeNamesOrUris: [name],
          searchDids: [context.owner],
        });

        if (options.json) {
          outputJson({ subject: uri, displayId, removed: name, ...result });
          return;
        }

        console.log(`✓ Removed label "${name}" from ${kind} ${displayId}`);
      } catch (error) {
        console.error(
          `✗ Failed to remove label: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  return label;
}
