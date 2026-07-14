import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { Writable } from 'node:stream';
import { AsyncEntry } from '@napi-rs/keyring';
import { InvalidCredentialDataError } from './errors.js';

const MACOS_SECURITY_PATH = '/usr/bin/security';
const MACOS_EXPECT_PATH = '/usr/bin/expect';
const EXPECT_SCRIPT_FD = '/dev/fd/3';
const MACOS_VALUE_PREFIX = 'tangled-cli-keychain-v1:';
const MACOS_CHUNK_MANIFEST_PREFIX = 'tangled-cli-keychain-v2:';
const MACOS_CHUNK_SERVICE_SUFFIX = ':tangled-cli-chunks-v2';
const MACOS_MAX_PROMPT_VALUE_LENGTH = 96;
const MACOS_MAX_CHUNKS = 4096;
const ITEM_NOT_FOUND_STATUS = 44;
const DUPLICATE_ITEM_STATUS = 45;

const SECURITY_PASSWORD_SCRIPT = String.raw`
log_user 0
set timeout 10
fconfigure stdin -encoding utf-8 -translation lf
if {[gets stdin password_hex] < 0} {
  exit 70
}
if {![regexp {^[0-9a-f]*$} $password_hex]} {
  set password_hex ""
  exit 70
}
set password [binary format H* $password_hex]
set password_hex ""
set env(LC_ALL) C
spawn -noecho /usr/bin/security {*}$argv
expect {
  "password data for new item:" {
    send -- "$password\r"
    exp_continue
  }
  "retype password for new item:" {
    send -- "$password\r"
    exp_continue
  }
  timeout {
    set password ""
    exit 124
  }
  eof {}
}
set password ""
set result [wait]
if {[lindex $result 2] != 0} {
  exit 1
}
exit [lindex $result 3]
`;

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

type SecurityRunner = (args: string[]) => Promise<CommandResult>;
type SecurityPasswordWriter = (args: string[], password: string) => Promise<CommandResult>;

interface SecurityPasswordInvocation {
  executable: string;
  args: string[];
  passwordInput: string;
  scriptInput: string;
}

interface ChunkManifest {
  generation: string;
  count: number;
}

export interface KeychainStore {
  setPassword(service: string, account: string, password: string): Promise<void>;
  getPassword(service: string, account: string): Promise<string | null>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

function runSecurityCommand(args: string[]): Promise<CommandResult> {
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

    child.stdin.end();
  });
}

/**
 * Build the macOS password-write process without ever placing the password in
 * argv. Apple's `security ... -w` reads from its controlling terminal rather
 * than stdin, so a small, non-logging Expect program supplies that prompt over
 * a private pseudo-terminal. The program and hex-encoded password travel on
 * separate pipes.
 */
export function createMacOsSecurityPasswordInvocation(
  securityArgs: string[],
  password: string
): SecurityPasswordInvocation {
  if (!/^[\x20-\x7e]+$/.test(password)) {
    throw new Error('The macOS Keychain helper requires an ASCII storage envelope');
  }

  return {
    executable: MACOS_EXPECT_PATH,
    args: ['-N', '-n', '-f', EXPECT_SCRIPT_FD, '--', ...securityArgs],
    passwordInput: `${Buffer.from(password, 'utf8').toString('hex')}\n`,
    scriptInput: SECURITY_PASSWORD_SCRIPT,
  };
}

function runSecurityPasswordCommand(args: string[], password: string): Promise<CommandResult> {
  const invocation = createMacOsSecurityPasswordInvocation(args, password);

  return new Promise((resolve, reject) => {
    const child = spawn(invocation.executable, invocation.args, {
      stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const scriptPipe = child.stdio[3];

    if (!(scriptPipe instanceof Writable)) {
      child.kill();
      reject(new Error('Failed to open the secure Keychain helper pipe'));
      return;
    }

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

    child.stdin.once('error', reject);
    scriptPipe.once('error', reject);
    child.stdin.end(invocation.passwordInput);
    scriptPipe.end(invocation.scriptInput);
  });
}

function commandError(action: string, result: CommandResult): Error {
  // Command output can contain credential data now or on a future macOS
  // version. Authentication errors expose only a fixed action and status.
  return new Error(`macOS Keychain ${action} failed: exit status ${result.code}`);
}

function passwordCommandError(action: string, result: CommandResult): Error {
  // The helper has handled the credential, so none of its captured output is
  // safe to surface even if a future platform version unexpectedly echoes it.
  return new Error(`macOS Keychain ${action} failed: exit status ${result.code}`);
}

function encodeMacOsKeychainValue(value: string): string {
  return `${MACOS_VALUE_PREFIX}${Buffer.from(value, 'utf8').toString('base64url')}`;
}

function decodeBase64Value(encoded: string): string {
  if (!/^[A-Za-z0-9_-]*$/.test(encoded)) {
    throw new InvalidCredentialDataError();
  }

  const bytes = Buffer.from(encoded, 'base64url');
  if (bytes.toString('base64url') !== encoded) {
    throw new InvalidCredentialDataError();
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new InvalidCredentialDataError();
  }
}

function decodeMacOsKeychainValue(value: string): string {
  if (!value.startsWith(MACOS_VALUE_PREFIX)) return value;
  return decodeBase64Value(value.slice(MACOS_VALUE_PREFIX.length));
}

function parseChunkManifest(value: string): ChunkManifest | null {
  if (!value.startsWith(MACOS_CHUNK_MANIFEST_PREFIX)) return null;

  const match = /^tangled-cli-keychain-v2:([0-9a-f]{16}):([1-9][0-9]*)$/.exec(value);
  const count = match ? Number.parseInt(match[2], 10) : 0;
  if (!match || !Number.isSafeInteger(count) || count > MACOS_MAX_CHUNKS) {
    throw new InvalidCredentialDataError();
  }

  return { generation: match[1], count };
}

function recoverableChunkManifest(value: string | null): ChunkManifest | null {
  if (value === null) return null;
  try {
    return parseChunkManifest(value);
  } catch (error) {
    // A corrupted manifest must not prevent logout or replacement. Its chunk
    // names are unrecoverable, but the primary item can still be removed.
    if (error instanceof InvalidCredentialDataError) return null;
    throw error;
  }
}

function chunkService(service: string): string {
  return `${service}${MACOS_CHUNK_SERVICE_SUFFIX}`;
}

function chunkAccount(service: string, account: string, generation: string, index: number): string {
  const owner = createHash('sha256').update(service).update('\0').update(account).digest('hex');
  return `${owner}:${generation}:${index}`;
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
  runSecurity: SecurityRunner = runSecurityCommand,
  writeSecurityPassword: SecurityPasswordWriter = runSecurityPasswordCommand
): KeychainStore {
  async function readItem(service: string, account: string): Promise<string | null> {
    const result = await runSecurity(['find-generic-password', '-a', account, '-s', service, '-w']);
    if (result.code === ITEM_NOT_FOUND_STATUS) return null;
    if (result.code !== 0) throw commandError('read', result);
    return withoutTrailingNewline(result.stdout);
  }

  async function writeItem(service: string, account: string, value: string): Promise<void> {
    if (value.length > MACOS_MAX_PROMPT_VALUE_LENGTH) {
      throw new Error('macOS Keychain write failed: internal chunk is too large');
    }

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
    const created = await writeSecurityPassword(createArgs, value);
    if (created.code === 0) return;

    const duplicate =
      created.code === DUPLICATE_ITEM_STATUS || created.stderr.includes('already exists');
    if (!duplicate) throw passwordCommandError('write', created);

    // Do not pass -T while updating. Existing items retain their access list,
    // including the stable helper after the one-time legacy-item authorization.
    const updateArgs = ['add-generic-password', '-U', '-a', account, '-s', service, '-w'];
    const updated = await writeSecurityPassword(updateArgs, value);
    if (updated.code !== 0) throw passwordCommandError('update', updated);
  }

  async function deleteItem(service: string, account: string): Promise<boolean> {
    const result = await runSecurity(['delete-generic-password', '-a', account, '-s', service]);
    if (result.code === ITEM_NOT_FOUND_STATUS) return false;
    if (result.code !== 0) throw commandError('delete', result);
    return true;
  }

  async function deleteChunks(
    service: string,
    account: string,
    manifest: ChunkManifest | null
  ): Promise<void> {
    if (!manifest) return;
    const serviceName = chunkService(service);
    for (let index = 0; index < manifest.count; index += 1) {
      await deleteItem(serviceName, chunkAccount(service, account, manifest.generation, index));
    }
  }

  return {
    async setPassword(service, account, password) {
      // The interactive `security` prompt hexifies non-ASCII input, cannot
      // represent embedded newlines, and truncates long values. Encode the
      // credential and split it into short Keychain items. The original item
      // contains either a short envelope or a manifest committed after every
      // chunk; unprefixed legacy values remain readable for migration.
      const previousValue = await readItem(service, account);
      const previousManifest = recoverableChunkManifest(previousValue);
      const encodedValue = encodeMacOsKeychainValue(password);

      if (encodedValue.length <= MACOS_MAX_PROMPT_VALUE_LENGTH) {
        await writeItem(service, account, encodedValue);
        await deleteChunks(service, account, previousManifest);
        return;
      }

      const encoded = encodedValue.slice(MACOS_VALUE_PREFIX.length);
      const chunks = encoded.match(new RegExp(`.{1,${MACOS_MAX_PROMPT_VALUE_LENGTH}}`, 'g')) ?? [];
      if (chunks.length === 0 || chunks.length > MACOS_MAX_CHUNKS) {
        throw new Error('macOS Keychain write failed: credential is too large');
      }

      const generation = randomBytes(8).toString('hex');
      const serviceName = chunkService(service);
      const manifest = `${MACOS_CHUNK_MANIFEST_PREFIX}${generation}:${chunks.length}`;
      let chunksWritten = 0;

      try {
        for (const [index, chunk] of chunks.entries()) {
          await writeItem(serviceName, chunkAccount(service, account, generation, index), chunk);
          chunksWritten += 1;
        }
        await writeItem(service, account, manifest);
      } catch (error) {
        await deleteChunks(service, account, {
          generation,
          count: chunksWritten,
        }).catch(() => undefined);
        throw error;
      }

      await deleteChunks(service, account, previousManifest);
    },

    async getPassword(service, account) {
      const storedValue = await readItem(service, account);
      if (storedValue === null) return null;

      const manifest = parseChunkManifest(storedValue);
      if (!manifest) return decodeMacOsKeychainValue(storedValue);

      const serviceName = chunkService(service);
      let encoded = '';
      for (let index = 0; index < manifest.count; index += 1) {
        const chunk = await readItem(
          serviceName,
          chunkAccount(service, account, manifest.generation, index)
        );
        if (chunk === null || !/^[A-Za-z0-9_-]+$/.test(chunk)) {
          throw new InvalidCredentialDataError();
        }
        encoded += chunk;
      }

      return decodeBase64Value(encoded);
    },

    async deletePassword(service, account) {
      const storedValue = await readItem(service, account);
      if (storedValue === null) return false;
      const manifest = recoverableChunkManifest(storedValue);
      // Delete chunks first so an interrupted cleanup can be retried while the
      // manifest still names them. A corrupted manifest falls back to deleting
      // the primary item so it can never lock the user out of logout.
      await deleteChunks(service, account, manifest);
      return await deleteItem(service, account);
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
