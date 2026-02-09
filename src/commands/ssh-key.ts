import { execSync } from 'node:child_process';
import { Command } from 'commander';
import { getCurrentSessionMetadata } from '../lib/session.js';

/**
 * Create the ssh-key command with subcommands for managing SSH keys
 */
export function createSshKeyCommand(): Command {
  const sshKey = new Command('ssh-key');
  sshKey.description('Verify SSH key setup for Git authentication');

  // Verify command
  sshKey
    .command('verify')
    .description('Verify SSH key authentication with git@tangled.org')
    .action(async () => {
      try {
        console.log('Testing SSH connection to git@tangled.org...\n');

        // Execute ssh -T git@tangled.org to test authentication
        let output: string;
        try {
          output = execSync('ssh -T git@tangled.org', {
            encoding: 'utf-8',
            stdio: 'pipe',
          });
        } catch (error) {
          // ssh -T returns non-zero exit code even on success
          // Capture stderr which contains the authentication message
          if (error instanceof Error && 'stderr' in error) {
            output = (error as { stderr: string }).stderr;
          } else {
            throw error;
          }
        }

        // Parse the DID from the output
        // Expected format: "Hi @did:plc:...! You've successfully authenticated."
        const didMatch = output.match(/@(did:plc:[a-z0-9]+)/i);

        if (!didMatch) {
          console.error('✗ SSH authentication failed');
          console.error('Could not find authenticated DID in response');
          console.error('\nPlease ensure you have:');
          console.error('1. Generated an SSH key (ssh-keygen -t ed25519)');
          console.error('2. Added your public key to https://tangled.org/settings/keys');
          console.error('3. Your SSH agent is running (ssh-add -l)');
          process.exit(1);
        }

        const did = didMatch[1];
        console.log('✓ SSH authentication successful');
        console.log(`  Authenticated as: ${did}`);

        // Check if this matches the logged-in user
        const session = await getCurrentSessionMetadata();
        if (session && session.did === did) {
          console.log(`  Handle: @${session.handle}`);
        }

        console.log('\n✓ Your SSH setup is working correctly!');
      } catch (error) {
        console.error(
          `\n✗ Failed to verify SSH setup: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        console.error('\nPlease ensure you have:');
        console.error('1. Generated an SSH key (ssh-keygen -t ed25519)');
        console.error('2. Added your public key to https://tangled.org/settings/keys');
        console.error('3. Your SSH agent is running (ssh-add -l)');
        process.exit(1);
      }
    });

  return sshKey;
}
