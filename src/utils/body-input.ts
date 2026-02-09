import * as fs from 'node:fs/promises';
import * as process from 'node:process';

/**
 * Read body content from various sources following GitHub CLI patterns
 *
 * @param bodyString - Direct body text from --body flag
 * @param bodyFilePath - File path or '-' for stdin
 * @returns Body content or undefined if no input provided
 * @throws Error if both bodyString and bodyFilePath are provided
 * @throws Error if file doesn't exist or cannot be read
 */
export async function readBodyInput(
	bodyString?: string,
	bodyFilePath?: string,
): Promise<string | undefined> {
	// Error if both are provided
	if (bodyString !== undefined && bodyFilePath !== undefined) {
		throw new Error(
			'Cannot specify both --body and --body-file. Choose one input method.',
		);
	}

	// Direct string input (including empty string)
	if (bodyString !== undefined) {
		return bodyString;
	}

	// File or stdin input
	if (bodyFilePath) {
		// Read from stdin
		if (bodyFilePath === '-') {
			return await readFromStdin();
		}

		// Read from file
		try {
			const stats = await fs.stat(bodyFilePath);

			if (stats.isDirectory()) {
				throw new Error(`'${bodyFilePath}' is a directory, not a file`);
			}

			const content = await fs.readFile(bodyFilePath, 'utf-8');
			return content;
		} catch (error) {
			if (error instanceof Error) {
				// Re-throw our custom directory error
				if (error.message.includes('is a directory')) {
					throw error;
				}

				// Handle ENOENT (file not found)
				if ('code' in error && error.code === 'ENOENT') {
					throw new Error(`File not found: ${bodyFilePath}`);
				}

				// Handle EACCES (permission denied)
				if ('code' in error && error.code === 'EACCES') {
					throw new Error(`Permission denied: ${bodyFilePath}`);
				}

				throw new Error(
					`Failed to read file '${bodyFilePath}': ${error.message}`,
				);
			}

			throw new Error(`Failed to read file '${bodyFilePath}': Unknown error`);
		}
	}

	// No input provided
	return undefined;
}

/**
 * Read content from stdin
 * @returns Content from stdin as string
 */
async function readFromStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];

		process.stdin.on('data', (chunk: Buffer) => {
			chunks.push(chunk);
		});

		process.stdin.on('end', () => {
			const content = Buffer.concat(chunks).toString('utf-8');
			resolve(content);
		});

		process.stdin.on('error', (error: Error) => {
			reject(new Error(`Failed to read from stdin: ${error.message}`));
		});

		// Resume stdin in case it's paused
		process.stdin.resume();
	});
}
