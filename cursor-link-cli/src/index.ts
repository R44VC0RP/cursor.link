#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { pushCommand } from './commands/push.js';
import { pullCommand } from './commands/pull.js';
import { authCommand } from './commands/auth.js';

const program = new Command();

program
  .name('cursor-link')
  .description('CLI tool to sync cursor rules with cursor.link')
  .version('1.0.0');

program
  .command('push')
  .description('Push local cursor rules to cursor.link')
  .option('--public', 'Make rules public (default: private)')
  .option('--force', 'Overwrite existing rules')
  .action(pushCommand);

program
  .command('pull')
  .description('Pull cursor rules from cursor.link')
  .option('--list', 'List available rules')
  .option('--all', 'Pull all rules')
  .action(pullCommand);

program
  .command('login')
  .description('Login to cursor.link')
  .action(() => authCommand('login'));

program
  .command('logout')
  .description('Logout from cursor.link')
  .action(() => authCommand('logout'));

program
  .command('status')
  .description('Show authentication status')
  .action(() => authCommand('status'));

program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);
