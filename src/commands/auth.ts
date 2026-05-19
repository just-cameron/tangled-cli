import { Command } from 'commander';
import { createApiClient } from '../lib/api-client.js';
import { loginWithOAuth } from '../lib/oauth.js';
import { getCurrentSessionMetadata } from '../lib/session.js';
import { promptForIdentifier, promptForLogin } from '../utils/prompts.js';

/**
 * Create the auth command with login and logout subcommands
 */
export function createAuthCommand(): Command {
  const auth = new Command('auth');
  auth.description('Manage authentication with AT Protocol');

  // Login command
  auth
    .command('login')
    .description('Login to your AT Protocol account')
    .option('--app-password', 'Use legacy app-password login instead of OAuth')
    .action(async (options: { appPassword?: boolean }) => {
      try {
        // Check if already logged in
        const existingSession = await getCurrentSessionMetadata();
        if (existingSession) {
          console.log(`Already logged in as @${existingSession.handle}`);
          console.log('Run "tang auth logout" first to switch accounts');
          process.exit(0);
        }

        if (!options.appPassword) {
          const identifier = await promptForIdentifier();
          console.log('\nStarting OAuth login...');
          const session = await loginWithOAuth(identifier);

          console.log(`\n✓ Successfully logged in as @${session.handle}`);
          console.log(`  DID: ${session.did}`);
          return;
        }

        const client = createApiClient();

        // Prompt for credentials
        const { identifier, password } = await promptForLogin();

        // Attempt login
        console.log('\nAuthenticating...');
        const session = await client.login(identifier, password);

        console.log(`\n✓ Successfully logged in as @${session.handle}`);
        console.log(`  DID: ${session.did}`);
      } catch (error) {
        console.error(
          `\n✗ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  // Logout command
  auth
    .command('logout')
    .description('Logout and clear stored credentials')
    .action(async () => {
      try {
        const client = createApiClient();

        // Check if logged in
        const session = await getCurrentSessionMetadata();
        if (!session) {
          console.log('Not currently logged in');
          process.exit(0);
        }

        // Perform logout
        await client.logout();

        console.log(`✓ Logged out @${session.handle}`);
      } catch (error) {
        console.error(
          `✗ Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  // Status command
  auth
    .command('status')
    .description('Check authentication status')
    .action(async () => {
      try {
        const session = await getCurrentSessionMetadata();

        if (session) {
          console.log('✓ Authenticated');
          console.log(`  Handle: @${session.handle}`);
          console.log(`  DID: ${session.did}`);
          console.log(`  PDS: ${session.pds}`);
          console.log(`  Auth: ${session.authType ?? 'app-password'}`);
          console.log(`  Last used: ${new Date(session.lastUsed).toLocaleString()}`);
        } else {
          console.log('✗ Not authenticated');
          console.log('Run "tang auth login" to authenticate');
        }
      } catch (error) {
        console.error(
          `✗ Failed to check status: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        process.exit(1);
      }
    });

  return auth;
}
