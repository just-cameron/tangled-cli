export class KeychainAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeychainAccessError';
  }
}

export class InvalidCredentialDataError extends Error {
  constructor() {
    super('Stored authentication data is invalid.');
    this.name = 'InvalidCredentialDataError';
  }
}
