import { spawn } from 'node:child_process';
import { AsyncEntry } from '@napi-rs/keyring';

const MACOS_SECURITY_PATH = '/usr/bin/security';
const ITEM_NOT_FOUND_STATUS = 44;
const DUPLICATE_ITEM_STATUS = 45;

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

type SecurityRunner = (args: string[], input?: string) => Promise<CommandResult>;

export interface KeychainStore {
  setPassword(service: string, account: string, password: string): Promise<void>;
  getPassword(service: string, account: string): Promise<string | null>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

function runSecurityCommand(args: string[], input?: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(MACOS_SECURITY_PATH, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });

    child.stdin.end(input);
  });
}

function commandError(action: string, result: CommandResult): Error {
  const detail = result.stderr.trim() || result.stdout.trim() || `exit status ${result.code}`;
  return new Error(`macOS Keychain ${action} failed: ${detail}`);
}

function passwordInput(password: string): string {
  // `security ... -w` without a value reads and confirms the secret on stdin.
  // This keeps session tokens out of argv and process listings.
  return `${password}\n${password}\n`;
}

function withoutTrailingNewline(value: string): string {
  return value.endsWith('\n') ? value.slice(0, -1) : value;
}

/**
 * Build a macOS Keychain store whose stable accessor is Apple's
 * `/usr/bin/security`, rather than the current Node executable.
 *
 * Homebrew Node builds are ad-hoc signed, so their code identity changes after
 * upgrades. Keychain entries created directly by Node then prompt again after
 * every upgrade. Trusting the stable system helper avoids coupling credentials
 * to a particular Node build while keeping secrets encrypted in the login
 * keychain and out of command-line arguments.
 */
export function createMacOsKeychainStore(
  runSecurity: SecurityRunner = runSecurityCommand
): KeychainStore {
  return {
    async setPassword(service, account, password) {
      const createArgs = [
        'add-generic-password',
        '-a',
        account,
        '-s',
        service,
        '-T',
        MACOS_SECURITY_PATH,
        '-w',
      ];
      const created = await runSecurity(createArgs, passwordInput(password));
      if (created.code === 0) return;

      const duplicate =
        created.code === DUPLICATE_ITEM_STATUS || created.stderr.includes('already exists');
      if (!duplicate) throw commandError('write', created);

      // Do not pass -T while updating. Existing items retain their access list,
      // including the stable helper after the one-time legacy-item authorization.
      const updateArgs = ['add-generic-password', '-U', '-a', account, '-s', service, '-w'];
      const updated = await runSecurity(updateArgs, passwordInput(password));
      if (updated.code !== 0) throw commandError('update', updated);
    },

    async getPassword(service, account) {
      const result = await runSecurity([
        'find-generic-password',
        '-a',
        account,
        '-s',
        service,
        '-w',
      ]);
      if (result.code === ITEM_NOT_FOUND_STATUS) return null;
      if (result.code !== 0) throw commandError('read', result);
      return withoutTrailingNewline(result.stdout);
    },

    async deletePassword(service, account) {
      const result = await runSecurity(['delete-generic-password', '-a', account, '-s', service]);
      if (result.code === ITEM_NOT_FOUND_STATUS) return false;
      if (result.code !== 0) throw commandError('delete', result);
      return true;
    },
  };
}

const macOsKeychainStore = createMacOsKeychainStore();

const nativeKeyringStore: KeychainStore = {
  async setPassword(service, account, password) {
    await new AsyncEntry(service, account).setPassword(password);
  },
  async getPassword(service, account) {
    return (await new AsyncEntry(service, account).getPassword()) ?? null;
  },
  async deletePassword(service, account) {
    return await new AsyncEntry(service, account).deleteCredential();
  },
};

function keychainStore(): KeychainStore {
  return process.platform === 'darwin' ? macOsKeychainStore : nativeKeyringStore;
}

export async function saveKeychainSecret(
  service: string,
  account: string,
  password: string
): Promise<void> {
  await keychainStore().setPassword(service, account, password);
}

export async function loadKeychainSecret(service: string, account: string): Promise<string | null> {
  return await keychainStore().getPassword(service, account);
}

export async function deleteKeychainSecret(service: string, account: string): Promise<boolean> {
  return await keychainStore().deletePassword(service, account);
}
