import { Command } from 'commander';
import { getCurrentRepoContext } from '../lib/context.js';

/**
 * Create the context command for debugging repository context resolution
 */
export function createContextCommand(): Command {
  const context = new Command('context');
  context.description('Show current repository context (debug)');

  context.action(async () => {
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

      console.log('✓ Repository context resolved:\n');
      console.log(`  Owner: ${repoContext.owner} (${repoContext.ownerType})`);
      console.log(`  Repository: ${repoContext.name}`);
      console.log(`  Protocol: ${repoContext.protocol}`);
      console.log(`  Remote: ${repoContext.remoteName} (${repoContext.remoteUrl})`);
    } catch (error) {
      console.error(
        `Failed to resolve context: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }
  });

  return context;
}
