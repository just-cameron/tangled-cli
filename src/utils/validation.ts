import { z } from 'zod';

/**
 * Validation schema for AT Protocol handle
 * Supports standard Bluesky handles (user.bsky.social) and custom domains (example.com)
 */
export const handleSchema = z
  .string()
  .min(1, 'Handle cannot be empty')
  .regex(
    /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/,
    'Invalid handle format. Must be a valid domain (e.g., user.bsky.social or example.com)'
  );

/**
 * Validation schema for AT Protocol DID
 */
export const didSchema = z
  .string()
  .min(1, 'DID cannot be empty')
  .regex(
    /^did:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]$/,
    'Invalid DID format. Must start with "did:" followed by method and identifier'
  );

/**
 * Validation schema for app password
 * AT Protocol app passwords are typically 19 characters with dashes
 */
export const appPasswordSchema = z
  .string()
  .min(1, 'Password cannot be empty')
  .max(1000, 'Password is too long');

/**
 * Validation schema for identifier (handle or DID)
 */
export const identifierSchema = z.union([handleSchema, didSchema]);

/**
 * Validate a handle
 * @throws {z.ZodError} if validation fails
 */
export function validateHandle(handle: string): string {
  return handleSchema.parse(handle);
}

/**
 * Validate a DID
 * @throws {z.ZodError} if validation fails
 */
export function validateDid(did: string): string {
  return didSchema.parse(did);
}

/**
 * Validate an identifier (handle or DID)
 * @throws {z.ZodError} if validation fails
 */
export function validateIdentifier(identifier: string): string {
  return identifierSchema.parse(identifier);
}

/**
 * Validate an app password
 * @throws {z.ZodError} if validation fails
 */
export function validateAppPassword(password: string): string {
  return appPasswordSchema.parse(password);
}

/**
 * Safe validation that returns success/error instead of throwing
 */
export function safeValidateHandle(
  handle: string
): { success: true; data: string } | { success: false; error: string } {
  const result = handleSchema.safeParse(handle);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Validation failed' };
}

/**
 * Safe validation that returns success/error instead of throwing
 */
export function safeValidateDid(
  did: string
): { success: true; data: string } | { success: false; error: string } {
  const result = didSchema.safeParse(did);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Validation failed' };
}

/**
 * Safe validation that returns success/error instead of throwing
 */
export function safeValidateIdentifier(
  identifier: string
): { success: true; data: string } | { success: false; error: string } {
  const result = identifierSchema.safeParse(identifier);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message ?? 'Validation failed' };
}

/**
 * Validation schema for Tangled-specific DID (did:plc: format only)
 */
export const tangledDidSchema = z
  .string()
  .regex(/^did:plc:[a-z0-9]+$/, 'Invalid Tangled DID format. Expected: did:plc:...');

/**
 * Check if a string is a valid AT Protocol handle
 * Returns true/false without throwing
 */
export function isValidHandle(handle: string): boolean {
  return handleSchema.safeParse(handle).success;
}

/**
 * Check if a string is a valid Tangled DID (did:plc: format)
 * Returns true/false without throwing
 */
export function isValidTangledDid(did: string): boolean {
  return tangledDidSchema.safeParse(did).success;
}
