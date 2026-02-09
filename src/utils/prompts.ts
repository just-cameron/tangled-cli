import { input, password } from '@inquirer/prompts';
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
