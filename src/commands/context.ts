import { Command } from 'commander';
import { createApiClient } from '../lib/api-client.js';
import { getCurrentRepoContext } from '../lib/context.js';
import { resolveRepository } from '../lib/repository.js';
import { requestedFields, wantsJson } from '../lib/runtime.js';
import { outputJson } from '../utils/formatting.js';

/**
 * Create the context command for debugging repository context resolution
 */
export function createContextCommand(): Command {
  const context = new Command('context');
  context
    .description('Show current repository context (debug)')
    .option('--json [fields]', 'Output JSON; optionally specify comma-separated fields');

  context.action(async (options: { json?: string | true }) => {
    try {
      const repoContext = await getCurrentRepoContext();

      if (!repoContext) {
        console.log('✗ Not in a Tangled repository');
        console.log('\nTo use this repository with Tangled, add a tangled.org remote:');
        console.log('  git remote add origin git@tangled.org:<did>/<repo>.git');
        console.log(
          '  # or, for repo-DID remotes: git remote add origin git@tangled.org:<repo-did>'
        );
        console.log('\nOr clone from tangled.org:');
        console.log('  git clone git@tangled.org:<did>/<repo>.git');
        console.log('  # or: git clone git@tangled.org:<repo-did>');
        process.exit(1);
      }

      const client = createApiClient();
      let resolved: Awaited<ReturnType<typeof resolveRepository>> | undefined;
      let resolutionError: string | undefined;
      try {
        resolved = await resolveRepository(repoContext, client);
      } catch (error) {
        resolutionError =
          error instanceof Error ? error.message : 'Unknown repository resolution error';
      }

      const data = {
        selector: {
          owner: repoContext.owner,
          ownerType: repoContext.ownerType,
          name: repoContext.name,
          source: repoContext.selectionSource ?? 'git',
        },
        repository: resolved,
        remote: {
          name: repoContext.remoteName,
          url: repoContext.remoteUrl,
          protocol: repoContext.protocol,
        },
        resolutionError,
      };

      if (wantsJson(options.json)) {
        outputJson(data, requestedFields(options.json));
        return;
      }

      console.log('✓ Repository context resolved:\n');
      console.log(`  Owner: ${repoContext.owner} (${repoContext.ownerType})`);
      console.log(`  Repository: ${repoContext.name}`);
      console.log(`  Protocol: ${repoContext.protocol}`);
      console.log(`  Remote: ${repoContext.remoteName} (${repoContext.remoteUrl})`);
      if (resolved) {
        console.log(`  Repository DID: ${resolved.repoDid}`);
        if (resolved.recordUri) console.log(`  Record: ${resolved.recordUri}`);
        if (resolved.knot) console.log(`  Knot: ${resolved.knot}`);
        if (resolved.spindle) console.log(`  Spindle: ${resolved.spindle}`);
        if (resolved.publicUrl) console.log(`  URL: ${resolved.publicUrl}`);
      } else if (resolutionError) {
        console.log(`  Metadata: unavailable (${resolutionError})`);
      }
    } catch (error) {
      console.error(
        `Failed to resolve context: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }
  });

  return context;
}
