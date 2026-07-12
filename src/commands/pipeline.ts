import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { simpleGit } from 'simple-git';
import { createApiClient } from '../lib/api-client.js';
import {
  aggregatePipelineStatus,
  cancelPipeline,
  getPipeline,
  type Pipeline,
  type PipelineWorkflow,
  pipelineId,
  queryAllPipelines,
  queryPipelines,
  subscribePipelineLogs,
  triggerPipeline,
} from '../lib/ci-api.js';
import { getCurrentRepoContext } from '../lib/context.js';
import { type ResolvedRepository, resolveRepository } from '../lib/repository.js';
import { confirmationGranted, inputAllowed, requestedFields, wantsJson } from '../lib/runtime.js';
import { ensureAuthenticated } from '../utils/auth-helpers.js';
import { formatDate, outputJson } from '../utils/formatting.js';

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function statusBadge(status: string): string {
  return `[${status.toUpperCase()}]`;
}

function duration(workflow: PipelineWorkflow): string | undefined {
  if (!workflow.startedAt) return undefined;
  const end = workflow.finishedAt ? new Date(workflow.finishedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((end - new Date(workflow.startedAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

async function repository(requireAuth = false): Promise<{
  client: ReturnType<typeof createApiClient>;
  repository: ResolvedRepository;
}> {
  const client = createApiClient();
  if (requireAuth) await ensureAuthenticated(client);
  const context = await getCurrentRepoContext();
  if (!context) throw new Error('No Tangled repository selected; use --repo <owner/name>');
  const resolved = await resolveRepository(context, client);
  if (!resolved.spindle) {
    throw new Error(`Repository ${resolved.repoDid} has no Spindle configured`);
  }
  return { client, repository: resolved };
}

function printPipeline(pipeline: Pipeline): void {
  console.log(`\nPipeline ${pipeline.id} ${statusBadge(aggregatePipelineStatus(pipeline))}`);
  console.log(`Commit: ${pipeline.commit}`);
  if (pipeline.createdAt) console.log(`Created: ${formatDate(pipeline.createdAt)}`);
  console.log('Workflows:');
  for (const workflow of pipeline.workflows) {
    const elapsed = duration(workflow);
    console.log(
      `  ${statusBadge(workflow.status)} ${workflow.name}${elapsed ? ` · ${elapsed}` : ''}`
    );
    if (workflow.error) console.log(`    ${workflow.error}`);
  }
}

function createListCommand(): Command {
  return new Command('list')
    .description('List CI pipelines for the selected repository')
    .option('-l, --limit <number>', 'Maximum pipelines per page', '50')
    .option('--cursor <cursor>', 'Continue from a pagination cursor')
    .option('--all', 'Fetch every page')
    .option('--commit <sha>', 'Filter by commit (repeatable)', collect, [])
    .option('--json [fields]', 'Output JSON; optionally select item fields')
    .action(
      async (options: {
        limit: string;
        cursor?: string;
        all?: boolean;
        commit: string[];
        json?: string | true;
      }) => {
        try {
          const { repository: repo } = await repository();
          const limit = Number.parseInt(options.limit, 10);
          if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
            throw new Error('limit must be between 1 and 250');
          }
          const page = options.all
            ? {
                total: 0,
                pipelines: await queryAllPipelines({
                  spindle: repo.spindle as string,
                  repoDid: repo.repoDid,
                  commits: options.commit,
                }),
                cursor: undefined,
              }
            : await queryPipelines({
                spindle: repo.spindle as string,
                repoDid: repo.repoDid,
                commits: options.commit,
                limit,
                cursor: options.cursor,
              });
          const items = page.pipelines.map((pipeline) => ({
            ...pipeline,
            status: aggregatePipelineStatus(pipeline),
          }));
          if (wantsJson(options.json)) {
            outputJson(
              {
                items,
                count: items.length,
                total: options.all ? items.length : page.total,
                nextCursor: page.cursor,
              },
              requestedFields(options.json)
            );
            return;
          }
          if (items.length === 0) {
            console.log('No pipelines found.');
            return;
          }
          console.log(`\nFound ${items.length} pipeline${items.length === 1 ? '' : 's'}:\n`);
          for (const item of items) {
            console.log(
              `  ${item.id}  ${statusBadge(item.status)}  ${item.commit.slice(0, 12)}  ${item.workflows.length} workflow${item.workflows.length === 1 ? '' : 's'}`
            );
          }
          if (page.cursor) console.log(`\nNext cursor: ${page.cursor}`);
        } catch (error) {
          console.error(
            `✗ Failed to list pipelines: ${error instanceof Error ? error.message : error}`
          );
          process.exitCode = 1;
        }
      }
    );
}

function createViewCommand(): Command {
  return new Command('view')
    .description('Show one CI pipeline and its workflow states')
    .argument('<pipeline>', 'Pipeline TID or AT-URI')
    .option('--json [fields]', 'Output JSON; optionally specify fields')
    .action(async (input: string, options: { json?: string | true }) => {
      try {
        const { repository: repo } = await repository();
        const pipeline = await getPipeline(repo.spindle as string, input);
        const data = { ...pipeline, status: aggregatePipelineStatus(pipeline) };
        if (wantsJson(options.json)) outputJson(data, requestedFields(options.json));
        else printPipeline(pipeline);
      } catch (error) {
        console.error(
          `✗ Failed to view pipeline: ${error instanceof Error ? error.message : error}`
        );
        process.exitCode = 1;
      }
    });
}

function createLogsCommand(): Command {
  return new Command('logs')
    .description('Stream logs directly from Spindle')
    .argument('<pipeline>', 'Pipeline TID or AT-URI')
    .option('-w, --workflow <name>', 'Show only this workflow (repeatable)', collect, [])
    .option('--json', 'Emit one JSON log event per line')
    .action(async (input: string, options: { workflow: string[]; json?: boolean }) => {
      try {
        const { repository: repo } = await repository();
        await subscribePipelineLogs({
          spindle: repo.spindle as string,
          pipeline: input,
          workflows: options.workflow,
          onEvent: (event) => {
            if (wantsJson(options.json)) {
              console.log(JSON.stringify(event));
            } else if (event.type === 'data') {
              const destination = event.stream === 'stderr' ? process.stderr : process.stdout;
              destination.write(event.content);
            } else {
              const command = event.command ? ` ${event.command}` : '';
              console.log(`\n[${event.workflow}:${event.step}]${command}`);
            }
          },
        });
      } catch (error) {
        console.error(
          `✗ Failed to read pipeline logs: ${error instanceof Error ? error.message : error}`
        );
        process.exitCode = 1;
      }
    });
}

function parseInputs(values: string[]): Array<{ key: string; value: string }> {
  return values.map((value) => {
    const separator = value.indexOf('=');
    if (separator < 1) throw new Error(`Invalid input '${value}'; expected key=value`);
    return { key: value.slice(0, separator), value: value.slice(separator + 1) };
  });
}

function originalManualInputs(trigger: Record<string, unknown>):
  | Array<{
      key: string;
      value: string;
    }>
  | undefined {
  if (!Array.isArray(trigger.inputs)) return undefined;
  const inputs = trigger.inputs.filter(
    (input): input is { key: string; value: string } =>
      typeof input === 'object' &&
      input !== null &&
      typeof (input as { key?: unknown }).key === 'string' &&
      typeof (input as { value?: unknown }).value === 'string'
  );
  return inputs.length > 0 ? inputs : undefined;
}

export function createRunCommand(): Command {
  return new Command('run')
    .description('Trigger a CI pipeline at an explicit commit')
    .option('--sha <sha>', '40-character commit SHA (default: HEAD)')
    .option('--ref <ref>', 'Source ref for display and TANGLED_REF')
    .option('-w, --workflow <name>', 'Run only this workflow (repeatable)', collect, [])
    .option('-i, --input <key=value>', 'Manual workflow input (repeatable)', collect, [])
    .option('--json [fields]', 'Output JSON; optionally specify fields')
    .action(
      async (options: {
        sha?: string;
        ref?: string;
        workflow: string[];
        input: string[];
        json?: string | true;
      }) => {
        try {
          const { client, repository: repo } = await repository(true);
          const git = simpleGit(process.cwd());
          const sha = options.sha ?? (await git.revparse(['HEAD'])).trim();
          if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error('sha must be a 40-character hash');
          let ref = options.ref;
          if (!ref) {
            try {
              ref = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim() || undefined;
            } catch {
              // --repo + --sha is valid outside a Git checkout; ref is optional.
            }
          }
          const result = await triggerPipeline({
            client,
            spindle: repo.spindle as string,
            repoDid: repo.repoDid,
            trigger: {
              $type: 'sh.tangled.ci.trigger#manual',
              sha,
              ref,
              inputs: parseInputs(options.input),
            },
            workflows: options.workflow.length > 0 ? options.workflow : undefined,
          });
          const data = { pipeline: result.pipeline, id: pipelineId(result.pipeline), sha, ref };
          if (wantsJson(options.json)) outputJson(data, requestedFields(options.json));
          else console.log(`✓ Pipeline ${data.id} triggered for ${sha.slice(0, 12)}`);
        } catch (error) {
          console.error(
            `✗ Failed to run pipeline: ${error instanceof Error ? error.message : error}`
          );
          process.exitCode = 1;
        }
      }
    );
}

async function confirmMutation(message: string, localYes?: boolean): Promise<boolean> {
  if (confirmationGranted(localYes)) return true;
  if (!inputAllowed()) throw new Error('Confirmation required; pass --yes with --no-input');
  return confirm({ message, default: false });
}

function createRetryCommand(): Command {
  return new Command('retry')
    .description('Retry a pipeline at the same commit')
    .argument('<pipeline>', 'Pipeline TID or AT-URI')
    .option('-w, --workflow <name>', 'Retry only this workflow (repeatable)', collect, [])
    .option('-y, --yes', 'Skip confirmation')
    .option('--json [fields]', 'Output JSON; optionally specify fields')
    .action(
      async (
        input: string,
        options: { workflow: string[]; yes?: boolean; json?: string | true }
      ) => {
        try {
          const { client, repository: repo } = await repository(true);
          const original = await getPipeline(repo.spindle as string, input);
          const workflows =
            options.workflow.length > 0
              ? options.workflow
              : original.workflows.map((workflow) => workflow.name);
          if (!(await confirmMutation(`Retry pipeline ${original.id}?`, options.yes))) return;
          const trigger = original.trigger;
          const ref = typeof trigger.ref === 'string' ? trigger.ref : undefined;
          const result = await triggerPipeline({
            client,
            spindle: repo.spindle as string,
            repoDid: repo.repoDid,
            trigger: {
              $type: 'sh.tangled.ci.trigger#manual',
              sha: original.commit,
              ref,
              sourceRepo: original.sourceRepo,
              inputs: originalManualInputs(trigger),
            },
            workflows: workflows.length > 0 ? workflows : undefined,
          });
          const data = {
            pipeline: result.pipeline,
            id: pipelineId(result.pipeline),
            retriedFrom: original.id,
            workflows,
          };
          if (wantsJson(options.json)) outputJson(data, requestedFields(options.json));
          else console.log(`✓ Pipeline ${original.id} retried as ${data.id}`);
        } catch (error) {
          console.error(
            `✗ Failed to retry pipeline: ${error instanceof Error ? error.message : error}`
          );
          process.exitCode = 1;
        }
      }
    );
}

function createCancelCommand(): Command {
  return new Command('cancel')
    .description('Cancel a pipeline or selected workflows')
    .argument('<pipeline>', 'Pipeline TID or AT-URI')
    .option('-w, --workflow <name>', 'Cancel only this workflow (repeatable)', collect, [])
    .option('-y, --yes', 'Skip confirmation')
    .option('--json [fields]', 'Output JSON; optionally specify fields')
    .action(
      async (
        input: string,
        options: { workflow: string[]; yes?: boolean; json?: string | true }
      ) => {
        try {
          const { client, repository: repo } = await repository(true);
          const id = pipelineId(input);
          if (!(await confirmMutation(`Cancel pipeline ${id}?`, options.yes))) return;
          await cancelPipeline({
            client,
            spindle: repo.spindle as string,
            repoDid: repo.repoDid,
            pipeline: id,
            workflows: options.workflow.length > 0 ? options.workflow : undefined,
          });
          const data = { id, cancelled: true, workflows: options.workflow };
          if (wantsJson(options.json)) outputJson(data, requestedFields(options.json));
          else console.log(`✓ Pipeline ${id} cancelled`);
        } catch (error) {
          console.error(
            `✗ Failed to cancel pipeline: ${error instanceof Error ? error.message : error}`
          );
          process.exitCode = 1;
        }
      }
    );
}

export function createPipelineCommand(): Command {
  return new Command('pipeline')
    .alias('ci')
    .description('Inspect and control Tangled CI pipelines')
    .addCommand(createListCommand())
    .addCommand(createViewCommand())
    .addCommand(createLogsCommand())
    .addCommand(createRunCommand())
    .addCommand(createRetryCommand())
    .addCommand(createCancelCommand());
}
