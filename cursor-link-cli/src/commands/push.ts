import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { AuthManager } from '../utils/auth-client.js';
import { ApiClient } from '../utils/api-client.js';
import { FileManager, CursorRule } from '../utils/file-utils.js';

interface PushOptions {
  public?: boolean;
  force?: boolean;
}

const authManager = new AuthManager();
const apiClient = new ApiClient(authManager);
const fileManager = new FileManager();

export async function pushCommand(options: PushOptions) {
  try {
    // Check authentication
    if (!(await authManager.isAuthenticated())) {
      console.log(chalk.red('❌ Not authenticated'));
      console.log(chalk.gray('Run: cursor-link login'));
      process.exit(1);
    }

    // Find and parse local rule files
    console.log(chalk.cyan('🔍 Scanning for cursor rules...'));
    
    let localRules: CursorRule[];
    try {
      localRules = await fileManager.getAllRules();
    } catch (error: any) {
      console.error(chalk.red(`❌ ${error.message}`));
      process.exit(1);
    }

    if (localRules.length === 0) {
      console.log(chalk.yellow('⚠️  No cursor rules found in .cursor/rules/'));
      console.log(chalk.gray('Make sure you have .mdc files in your .cursor/rules/ directory.'));
      return;
    }

    console.log(chalk.green(`✅ Found ${localRules.length} local rule(s)`));
    
    // Get existing remote rules to check for conflicts
    const spinner = ora('Fetching existing rules from server...').start();
    let existingRules;
    try {
      existingRules = await apiClient.getUserRules();
      spinner.succeed(`Found ${existingRules.length} existing rule(s) on server`);
    } catch (error: any) {
      spinner.fail(`Failed to fetch existing rules: ${error.message}`);
      process.exit(1);
    }

    // Check for conflicts
    const conflicts = [];
    const existingTitles = new Set(existingRules.map(rule => rule.title.toLowerCase()));
    
    for (const localRule of localRules) {
      if (existingTitles.has(localRule.title.toLowerCase())) {
        conflicts.push(localRule);
      }
    }

    // Handle conflicts
    if (conflicts.length > 0 && !options.force) {
      console.log(chalk.yellow(`\n⚠️  ${conflicts.length} rule(s) already exist on the server:`));
      conflicts.forEach(rule => {
        console.log(chalk.gray(`   • ${rule.title}`));
      });
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'How would you like to handle conflicts?',
          choices: [
            { name: 'Skip conflicting rules', value: 'skip' },
            { name: 'Overwrite existing rules', value: 'overwrite' },
            { name: 'Cancel push operation', value: 'cancel' },
          ],
        },
      ]);
      
      if (action === 'cancel') {
        console.log(chalk.gray('Push cancelled'));
        return;
      }
      
      if (action === 'skip') {
        // Remove conflicting rules from the list
        const conflictTitles = new Set(conflicts.map(r => r.title.toLowerCase()));
        localRules = localRules.filter(rule => !conflictTitles.has(rule.title.toLowerCase()));
        
        if (localRules.length === 0) {
          console.log(chalk.yellow('No rules to push after skipping conflicts'));
          return;
        }
      }
    }

    // Determine visibility
    const isPublic = options.public || false;
    
    if (!options.public && localRules.length > 0) {
      const { makePublic } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'makePublic',
          message: 'Make rules public? (others can discover and use them)',
          default: false,
        },
      ]);
      options.public = makePublic;
    }

    // Push rules
    console.log(chalk.cyan(`\n📤 Pushing ${localRules.length} rule(s)...`));
    
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const localRule of localRules) {
      const pushSpinner = ora(`Pushing "${localRule.title}"`).start();
      
      try {
        // Check if rule exists
        const existingRule = existingRules.find(r => r.title.toLowerCase() === localRule.title.toLowerCase());
        
        const ruleData = {
          title: localRule.title,
          content: localRule.content,
          ruleType: localRule.ruleType,
          isPublic: options.public || false,
        };
        
        if (existingRule && (options.force || conflicts.some(c => c.title.toLowerCase() === localRule.title.toLowerCase()))) {
          // Update existing rule
          await apiClient.updateRule(existingRule.id, ruleData);
          pushSpinner.succeed(chalk.green(`Updated "${localRule.title}"`));
          results.updated++;
        } else {
          // Create new rule
          await apiClient.createRule(ruleData);
          pushSpinner.succeed(chalk.green(`Created "${localRule.title}"`));
          results.created++;
        }
      } catch (error: any) {
        pushSpinner.fail(chalk.red(`Failed to push "${localRule.title}"`));
        results.failed++;
        results.errors.push(`${localRule.title}: ${error.message}`);
      }
    }

    // Show summary
    console.log(chalk.cyan('\n📊 Push Summary:'));
    if (results.created > 0) {
      console.log(chalk.green(`   ✅ Created: ${results.created}`));
    }
    if (results.updated > 0) {
      console.log(chalk.yellow(`   🔄 Updated: ${results.updated}`));
    }
    if (results.failed > 0) {
      console.log(chalk.red(`   ❌ Failed: ${results.failed}`));
      console.log(chalk.gray('\nErrors:'));
      results.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
    }

    if (results.created > 0 || results.updated > 0) {
      console.log(chalk.green('\n🎉 Rules successfully pushed to cursor.link!'));
      const visibility = options.public ? 'public' : 'private';
      console.log(chalk.gray(`   Visibility: ${visibility}`));
      console.log(chalk.gray('   View your rules at: https://cursor.link/dashboard'));
    }

  } catch (error: any) {
    console.error(chalk.red(`❌ ${error.message}`));
    process.exit(1);
  }
}
