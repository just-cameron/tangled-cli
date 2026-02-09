import { confirm, input, password, select } from '@inquirer/prompts';
import { safeValidateIdentifier } from './validation.js';

/**
 * Prompt for user's AT Protocol identifier (handle or DID)
 */
export async function promptForIdentifier(): Promise<string> {
  return await input({
    message: 'Enter your AT Protocol identifier (handle or DID):',
    validate: (value: string) => {
      if (!value.trim()) {
        return 'Identifier cannot be empty';
      }

      const result = safeValidateIdentifier(value.trim());
      if (!result.success) {
        return result.error;
      }

      return true;
    },
  });
}

/**
 * Prompt for app password
 */
export async function promptForPassword(): Promise<string> {
  return await password({
    message: 'Enter your app password:',
    mask: '*',
    validate: (value: string) => {
      if (!value) {
        return 'Password cannot be empty';
      }
      return true;
    },
  });
}

/**
 * Prompt for login credentials
 * Returns identifier and password
 */
export async function promptForLogin(): Promise<{
  identifier: string;
  password: string;
}> {
  const identifier = await promptForIdentifier();
  const passwordValue = await promptForPassword();

  return {
    identifier,
    password: passwordValue,
  };
}

/**
 * Prompt user to select a Git remote when multiple tangled remotes exist
 *
 * @param remotes - Array of available remotes with name and URL
 * @returns Selected remote name
 */
export async function promptForRemoteSelection(
  remotes: Array<{ name: string; url: string }>
): Promise<string> {
  const choices = remotes.map((remote) => ({
    name: `${remote.name} (${remote.url})`,
    value: remote.name,
  }));

  // Default to "origin" if present
  const defaultValue = remotes.find((r) => r.name === 'origin')?.name;

  return await select({
    message: 'Multiple tangled.org remotes found. Which one would you like to use?',
    choices,
    default: defaultValue,
  });
}

/**
 * Prompt user whether to save remote selection to config
 *
 * @returns true if user wants to save
 */
export async function promptToSaveRemote(): Promise<boolean> {
  return await confirm({
    message: 'Save this remote selection for this repository? (saves to .tangledrc)',
    default: false,
  });
}
