import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { simpleGit } from 'simple-git';
import { createApiClient } from '../lib/api-client.js';
import { queryPipelines } from '../lib/ci-api.js';
import { getCurrentRepoContext } from '../lib/context.js';
import { resolvePdsEndpoint } from '../lib/public-records.js';
import { resolveRepository } from '../lib/repository.js';
import { requestedFields, wantsJson } from '../lib/runtime.js';
import { getCurrentSessionMetadata } from '../lib/session.js';
import { outputJson } from '../utils/formatting.js';

type CheckStatus = 'pass' | 'warn' | 'fail';

interface Check {
  name: string;
  status: CheckStatus;
  detail: string;
  remediation?: string;
}

function result(
  checks: Check[],
  name: string,
  status: CheckStatus,
  detail: string,
  remediation?: string
): void {
  checks.push({ name, status, detail, remediation });
}

export function createDoctorCommand(): Command {
  return new Command('doctor')
    .description('Diagnose authentication, repository resolution, and Spindle access')
    .option('--json [fields]', 'Output JSON; optionally specify check fields')
    .action(async (options: { json?: string | true }) => {
      const checks: Check[] = [];
      const major = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
      result(
        checks,
        'runtime',
        major >= 22 ? 'pass' : 'fail',
        `Node ${process.versions.node}`,
        major >= 22 ? undefined : 'Install Node 22 or newer.'
      );

      try {
        await access(join(homedir(), '.config', 'tangled'));
        result(checks, 'config-directory', 'pass', '~/.config/tangled is accessible');
      } catch {
        result(
          checks,
          'config-directory',
          'warn',
          '~/.config/tangled does not exist yet',
          'Run tang auth login to initialize it.'
        );
      }

      const session = await getCurrentSessionMetadata().catch(() => null);
      if (!session) {
        result(checks, 'authentication', 'warn', 'No active session', 'Run tang auth login.');
      } else {
        try {
          const pds = await resolvePdsEndpoint(session.did);
          result(checks, 'did-resolution', 'pass', `${session.did} → ${pds}`);
        } catch (error) {
          result(
            checks,
            'did-resolution',
            'fail',
            error instanceof Error ? error.message : String(error),
            'Check network access and the account DID document.'
          );
        }
        try {
          const client = createApiClient();
          if (!(await client.resumeSession())) {
            throw new Error('Stored session could not be resumed');
          }
          const agent = await client.getAgent();
          await agent.getProfile({ actor: session.did });
          result(checks, 'authentication', 'pass', `Authenticated as @${session.handle}`);
        } catch (error) {
          result(
            checks,
            'authentication',
            'fail',
            error instanceof Error ? error.message : String(error),
            'Run tang auth logout --yes, then tang auth login.'
          );
        }
      }

      let context: Awaited<ReturnType<typeof getCurrentRepoContext>>;
      try {
        context = await getCurrentRepoContext();
      } catch (error) {
        context = null;
        result(
          checks,
          'repository-selector',
          'fail',
          error instanceof Error ? error.message : String(error),
          'Use --repo <owner/name> or TANG_REPO with a valid selector.'
        );
      }

      if (!context) {
        result(
          checks,
          'repository-selector',
          'warn',
          'No Tangled repository selected',
          'Use --repo <owner/name>, set TANG_REPO, or run inside a Tangled Git checkout.'
        );
      } else {
        try {
          const client = createApiClient();
          const repo = await resolveRepository(context, client);
          result(
            checks,
            'repository-resolution',
            'pass',
            `${repo.owner}/${repo.name} → ${repo.repoDid}`
          );
          if (!repo.spindle) {
            result(
              checks,
              'spindle-discovery',
              'warn',
              'Repository has no Spindle configured',
              'Configure a Spindle on the repository before using pipeline commands.'
            );
          } else {
            result(checks, 'spindle-discovery', 'pass', repo.spindle);
            try {
              await queryPipelines({
                spindle: repo.spindle,
                repoDid: repo.repoDid,
                limit: 1,
              });
              result(checks, 'spindle-query', 'pass', 'Pipeline query endpoint is reachable');
            } catch (error) {
              result(
                checks,
                'spindle-query',
                'fail',
                error instanceof Error ? error.message : String(error),
                'Check the repository Spindle URL and network access.'
              );
            }
          }
        } catch (error) {
          result(
            checks,
            'repository-resolution',
            'fail',
            error instanceof Error ? error.message : String(error),
            'Run tang context --json and verify --repo or the Tangled Git remote.'
          );
        }
      }

      try {
        const git = simpleGit(process.cwd());
        const version = await git.version();
        result(checks, 'git', 'pass', `Git ${version.major}.${version.minor}.${version.patch}`);
      } catch (error) {
        result(
          checks,
          'git',
          'fail',
          error instanceof Error ? error.message : String(error),
          'Install Git and ensure it is on PATH.'
        );
      }

      const summary = {
        pass: checks.filter((check) => check.status === 'pass').length,
        warn: checks.filter((check) => check.status === 'warn').length,
        fail: checks.filter((check) => check.status === 'fail').length,
      };
      if (wantsJson(options.json)) {
        outputJson({ checks, summary }, requestedFields(options.json));
      } else {
        for (const check of checks) {
          const marker = check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✗';
          console.log(`${marker} ${check.name}: ${check.detail}`);
          if (check.remediation) console.log(`  ${check.remediation}`);
        }
        console.log(`\n${summary.pass} passed · ${summary.warn} warnings · ${summary.fail} failed`);
      }
      if (summary.fail > 0) process.exitCode = 1;
    });
}
