import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { createApiClient } from '../lib/api-client.js';
import { loginWithOAuth } from '../lib/oauth.js';
import { confirmationGranted, inputAllowed, requestedFields, wantsJson } from '../lib/runtime.js';
import {
  getCurrentSessionMetadata,
  loadOAuthSession,
  loadSession,
  type SessionMetadata,
} from '../lib/session.js';
import { outputJson } from '../utils/formatting.js';
import { promptForIdentifier, promptForLogin } from '../utils/prompts.js';

function findAccessToken(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  for (const [key, item] of Object.entries(value)) {
    if (
      (key === 'accessJwt' || key === 'access_token' || key === 'accessToken') &&
      typeof item === 'string'
    ) {
      return item;
    }
  }
  for (const item of Object.values(value)) {
    const found = findAccessToken(item);
    if (found) return found;
  }
  return undefined;
}

function tokenDiagnostics(token: string | undefined): Record<string, unknown> {
  if (!token) return { available: false };
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString()) as {
      exp?: number;
      iat?: number;
      aud?: string;
      iss?: string;
      scope?: string;
      lxm?: string;
    };
    return {
      available: true,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
      issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
      expired: payload.exp ? payload.exp * 1000 <= Date.now() : undefined,
      audience: payload.aud,
      issuer: payload.iss,
      scope: payload.scope,
      method: payload.lxm,
    };
  } catch {
    return { available: true, format: 'opaque' };
  }
}

async function sessionToken(session: SessionMetadata): Promise<string | undefined> {
  const saved =
    session.authType === 'oauth'
      ? await loadOAuthSession(session.did)
      : await loadSession(session.did);
  return findAccessToken(saved);
}

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
        if (!inputAllowed()) {
          throw new Error('auth login requires interactive input; remove --no-input');
        }
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
    .option('-y, --yes', 'Skip confirmation')
    .action(async (options: { yes?: boolean }) => {
      try {
        const client = createApiClient();

        // Check if logged in
        const session = await getCurrentSessionMetadata();
        if (!session) {
          console.log('Not currently logged in');
          process.exit(0);
        }

        if (!confirmationGranted(options.yes)) {
          if (!inputAllowed()) throw new Error('auth logout requires --yes with --no-input');
          const proceed = await confirm({ message: `Log out @${session.handle}?`, default: false });
          if (!proceed) return;
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
    .option('--diagnostic', 'Check stored token metadata without printing the token')
    .option('--show-token', 'Print the access token after an interactive warning')
    .option('--json [fields]', 'Output JSON; optionally specify fields')
    .action(
      async (options: { diagnostic?: boolean; showToken?: boolean; json?: string | true }) => {
        try {
          const session = await getCurrentSessionMetadata();

          if (session) {
            const token =
              options.diagnostic || options.showToken ? await sessionToken(session) : undefined;
            const data = {
              authenticated: true,
              handle: session.handle,
              did: session.did,
              pds: session.pds,
              authType: session.authType ?? 'app-password',
              lastUsed: session.lastUsed,
              token: options.diagnostic ? tokenDiagnostics(token) : undefined,
            };
            if (options.showToken) {
              if (!inputAllowed()) {
                throw new Error('--show-token requires interactive input; remove --no-input');
              }
              if (wantsJson(options.json) || !process.stdin.isTTY || !process.stdout.isTTY) {
                throw new Error(
                  '--show-token is only available in an interactive terminal without --json'
                );
              }
              const proceed = await confirm({
                message:
                  'Print the bearer token? It grants account access and may be captured in scrollback.',
                default: false,
              });
              if (!proceed) return;
              if (!token) throw new Error('No access token was found in the stored session');
              console.log(token);
              return;
            }
            if (wantsJson(options.json)) {
              outputJson(data, requestedFields(options.json));
              return;
            }
            console.log('✓ Authenticated');
            console.log(`  Handle: @${session.handle}`);
            console.log(`  DID: ${session.did}`);
            console.log(`  PDS: ${session.pds}`);
            console.log(`  Auth: ${session.authType ?? 'app-password'}`);
            console.log(`  Last used: ${new Date(session.lastUsed).toLocaleString()}`);
            if (options.diagnostic) {
              const diagnostics = tokenDiagnostics(token);
              console.log('  Token: present (value hidden)');
              if (diagnostics.expiresAt) console.log(`  Expires: ${diagnostics.expiresAt}`);
              if (diagnostics.scope) console.log(`  Scope: ${diagnostics.scope}`);
            }
          } else {
            if (wantsJson(options.json)) {
              outputJson({ authenticated: false });
              return;
            }
            console.log('✗ Not authenticated');
            console.log('Run "tang auth login" to authenticate');
          }
        } catch (error) {
          console.error(
            `✗ Failed to check status: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      }
    );

  return auth;
}
