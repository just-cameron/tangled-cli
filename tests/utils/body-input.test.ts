import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as process from 'node:process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readBodyInput } from '../../src/utils/body-input.js';

describe('readBodyInput', () => {
	describe('direct string input', () => {
		it('should return body string when provided', async () => {
			const result = await readBodyInput('Test body content');
			expect(result).toBe('Test body content');
		});

		it('should return multiline body string', async () => {
			const multiline = 'Line 1\nLine 2\nLine 3';
			const result = await readBodyInput(multiline);
			expect(result).toBe(multiline);
		});

		it('should return empty string', async () => {
			const result = await readBodyInput('');
			expect(result).toBe('');
		});
	});

	describe('file input', () => {
		let tempDir: string;
		let testFile: string;

		beforeEach(async () => {
			// Create a temporary directory for test files
			tempDir = path.join(process.cwd(), 'tests', 'fixtures', 'temp');
			await fs.mkdir(tempDir, { recursive: true });
			testFile = path.join(tempDir, 'test-body.txt');
		});

		afterEach(async () => {
			// Clean up test files
			try {
				await fs.rm(tempDir, { recursive: true, force: true });
			} catch {
				// Ignore cleanup errors
			}
		});

		it('should read content from file', async () => {
			const content = 'File content here';
			await fs.writeFile(testFile, content, 'utf-8');

			const result = await readBodyInput(undefined, testFile);
			expect(result).toBe(content);
		});

		it('should read multiline content from file', async () => {
			const content = 'Line 1\nLine 2\nLine 3';
			await fs.writeFile(testFile, content, 'utf-8');

			const result = await readBodyInput(undefined, testFile);
			expect(result).toBe(content);
		});

		it('should read empty file', async () => {
			await fs.writeFile(testFile, '', 'utf-8');

			const result = await readBodyInput(undefined, testFile);
			expect(result).toBe('');
		});

		it('should throw error when file does not exist', async () => {
			const nonExistentFile = path.join(tempDir, 'does-not-exist.txt');

			await expect(readBodyInput(undefined, nonExistentFile)).rejects.toThrow(
				`File not found: ${nonExistentFile}`,
			);
		});

		it('should throw error when path is a directory', async () => {
			await expect(readBodyInput(undefined, tempDir)).rejects.toThrow(
				`'${tempDir}' is a directory, not a file`,
			);
		});
	});

	describe('stdin input', () => {
		// Note: Stdin reading is tested via integration tests
		// Mocking process.stdin is complex and unreliable in unit tests
		// The implementation is straightforward and covered by:
		// 1. File I/O tests (same event-driven patterns)
		// 2. Integration tests with real stdin
		it.skip('stdin reading is tested via integration tests', () => {
			// Placeholder to document testing approach
		});
	});

	describe('no input', () => {
		it('should return undefined when no input provided', async () => {
			const result = await readBodyInput();
			expect(result).toBeUndefined();
		});

		it('should return undefined when both params are undefined', async () => {
			const result = await readBodyInput(undefined, undefined);
			expect(result).toBeUndefined();
		});
	});

	describe('error cases', () => {
		it('should throw error when both bodyString and bodyFilePath provided', async () => {
			await expect(
				readBodyInput('body text', '/path/to/file'),
			).rejects.toThrow(
				'Cannot specify both --body and --body-file. Choose one input method.',
			);
		});

		it('should throw error when both bodyString and stdin flag provided', async () => {
			await expect(readBodyInput('body text', '-')).rejects.toThrow(
				'Cannot specify both --body and --body-file. Choose one input method.',
			);
		});
	});
});
