#!/usr/bin/env node
import { Command } from 'commander';
import packageJson from '../package.json' with { type: 'json' };
import { createAuthCommand } from './commands/auth.js';
import { createConfigCommand } from './commands/config.js';
import { createContextCommand } from './commands/context.js';
import { createDoctorCommand } from './commands/doctor.js';
import { createIssueCommand } from './commands/issue.js';
import { createLabelCommand } from './commands/label.js';
import { createPipelineCommand, createRunCommand } from './commands/pipeline.js';
import { createPrCommand } from './commands/pr.js';
import { createSshKeyCommand } from './commands/ssh-key.js';
import { setRuntimeOptions } from './lib/runtime.js';

const program = new Command();

program
  .name('tang')
  .description('A CLI for Tangled.org - AT Protocol-based Git hosting')
  .version(packageJson.version, '-v, --version', 'Output the current version')
  .option('-R, --repo <repository>', 'Select repository (OWNER/NAME, URL, DID, or AT-URI)')
  .option('--json', 'Emit machine-readable JSON')
  .option('--fields <fields>', 'Comma-separated fields to include in JSON output')
  .option('--no-input', 'Never prompt for input')
  .option('-y, --yes', 'Assume yes for confirmation prompts')
  .option('-q, --quiet', 'Suppress non-essential human-readable output');

program.hook('preAction', (rootCommand, actionCommand) => {
  const root = rootCommand.opts<{
    repo?: string;
    json?: boolean;
    fields?: string;
    input?: boolean;
    yes?: boolean;
    quiet?: boolean;
  }>();
  const local = actionCommand.opts<{ json?: boolean | string; yes?: boolean }>();
  setRuntimeOptions({
    repo: root.repo,
    json: root.json === true || local.json !== undefined,
    fields: typeof local.json === 'string' ? local.json : root.fields,
    noInput: root.input === false,
    yes: root.yes === true || local.yes === true,
    quiet: root.quiet,
  });
});

// Register commands
program.addCommand(createAuthCommand());
program.addCommand(createSshKeyCommand());
program.addCommand(createConfigCommand());
program.addCommand(createContextCommand());
program.addCommand(createDoctorCommand());
program.addCommand(createIssueCommand());
program.addCommand(createPrCommand());
program.addCommand(createPipelineCommand());
program.addCommand(createRunCommand());
program.addCommand(createLabelCommand());

program.parse(process.argv);
