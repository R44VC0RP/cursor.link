import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { AuthManager } from '../utils/auth-client.js';
import { ApiClient, RemoteRule } from '../utils/api-client.js';
import { FileManager } from '../utils/file-utils.js';

interface PullOptions {
  list?: boolean;
  all?: boolean;
}

const authManager = new AuthManager();
const apiClient = new ApiClient(authManager);
const fileManager = new FileManager();

export async function pullCommand(options: PullOptions) {
  try {
    // Check authentication
    if (!(await authManager.isAuthenticated())) {
      console.log(chalk.red('❌ Not authenticated'));
      console.log(chalk.gray('Run: cursor-link login'));
      process.exit(1);
    }

    // Ensure .cursor/rules directory exists
    try {
      fileManager.createRulesDir();
    } catch (error) {
      // Directory might already exist, which is fine
    }

    // Fetch available rules
    const spinner = ora('Fetching available rules...').start();
    let availableRules: RemoteRule[];
    
    try {
      if (options.all) {
        // Fetch all accessible rules (user's rules + public rules)
        availableRules = await apiClient.getAllAccessibleRules();
      } else {
        // Fetch only user's rules
        availableRules = await apiClient.getUserRules();
      }
      spinner.succeed(`Found ${availableRules.length} available rule(s)`);
    } catch (error: any) {
      spinner.fail(`Failed to fetch rules: ${error.message}`);
      process.exit(1);
    }

    if (availableRules.length === 0) {
      console.log(chalk.yellow('⚠️  No rules available to pull'));
      if (!options.all) {
        console.log(chalk.gray('Try "cursor-link pull --all" to see public rules from other users'));
      }
      return;
    }

    // Handle list option
    if (options.list) {
      displayRulesList(availableRules);
      return;
    }

    // Interactive rule selection
    const selectedRules = await selectRulesToPull(availableRules);
    
    if (selectedRules.length === 0) {
      console.log(chalk.gray('No rules selected'));
      return;
    }

    // Check for local file conflicts
    const conflicts: { rule: RemoteRule; exists: boolean }[] = [];
    
    for (const rule of selectedRules) {
      const filename = generateFilename(rule.title);
      const exists = fileManager.ruleFileExists(filename, rule.type as 'rule' | 'command');
      conflicts.push({ rule, exists });
    }

    const existingFiles = conflicts.filter(c => c.exists);
    
    if (existingFiles.length > 0) {
      console.log(chalk.yellow(`\n⚠️  ${existingFiles.length} file(s) already exist locally:`));
      existingFiles.forEach(({ rule }) => {
        const filename = generateFilename(rule.title);
        const extension = rule.type === 'command' ? '.md' : '.mdc';
        console.log(chalk.gray(`   • ${filename}${extension}`));
      });
      
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Overwrite existing files?',
          default: false,
        },
      ]);
      
      if (!overwrite) {
        // Filter out existing files
        const existingTitles = new Set(existingFiles.map(c => c.rule.title));
        selectedRules.splice(0, selectedRules.length, 
          ...selectedRules.filter(rule => !existingTitles.has(rule.title)));
        
        if (selectedRules.length === 0) {
          console.log(chalk.gray('No rules to pull after skipping existing files'));
          return;
        }
        
        console.log(chalk.gray(`Continuing with ${selectedRules.length} remaining rule(s)`));
      }
    }

    // Pull selected rules
    console.log(chalk.cyan(`\n📥 Pulling ${selectedRules.length} rule(s)...`));
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const rule of selectedRules) {
      const pullSpinner = ora(`Pulling "${rule.title}"`).start();
      
      try {
        const filename = generateFilename(rule.title);
        
        // Determine alwaysApply based on ruleType
        const alwaysApply = rule.ruleType === 'always';
        
        await fileManager.writeRuleFile({
          filename,
          title: rule.title,
          content: rule.content,
          type: rule.type as 'rule' | 'command',
          alwaysApply,
        });
        
        const extension = rule.type === 'command' ? '.md' : '.mdc';
        pullSpinner.succeed(chalk.green(`Saved "${rule.title}" → ${filename}${extension}`));
        results.success++;
      } catch (error: any) {
        pullSpinner.fail(chalk.red(`Failed to save "${rule.title}"`));
        results.failed++;
        results.errors.push(`${rule.title}: ${error.message}`);
      }
    }

    // Show summary
    console.log(chalk.cyan('\n📊 Pull Summary:'));
    if (results.success > 0) {
      console.log(chalk.green(`   ✅ Downloaded: ${results.success}`));
    }
    if (results.failed > 0) {
      console.log(chalk.red(`   ❌ Failed: ${results.failed}`));
      console.log(chalk.gray('\nErrors:'));
      results.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
    }

    if (results.success > 0) {
      console.log(chalk.green('\n🎉 Rules successfully downloaded!'));
      console.log(chalk.gray('   Files saved to: .cursor/rules/'));
    }

  } catch (error: any) {
    console.error(chalk.red(`❌ ${error.message}`));
    process.exit(1);
  }
}

function displayRulesList(rules: RemoteRule[]) {
  console.log(chalk.cyan('\n📋 Available Rules:'));
  console.log(chalk.gray('────────────────────────────────────────\n'));
  
  rules.forEach((rule, index) => {
    const number = String(index + 1).padStart(2, ' ');
    const title = rule.title;
    const itemType = rule.type === 'command' ? 'Command' : 'Rule';
    const ruleType = rule.ruleType;
    const visibility = rule.isPublic ? 'public' : 'private';
    const views = rule.views;
    const date = new Date(rule.updatedAt).toLocaleDateString();
    
    console.log(chalk.white(`${number}. ${chalk.bold(title)} ${chalk.cyan(`[${itemType}]`)}`));
    console.log(chalk.gray(`    Rule Type: ${ruleType} | Visibility: ${visibility} | Views: ${views} | Updated: ${date}`));
    
    // Show content preview (first line)
    const firstLine = rule.content.split('\n')[0]?.trim();
    if (firstLine && firstLine !== `# ${title}`) {
      const preview = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
      console.log(chalk.gray(`    Preview: ${preview}`));
    }
    
    console.log(); // Empty line between rules
  });
}

async function selectRulesToPull(rules: RemoteRule[]): Promise<RemoteRule[]> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Select specific rules', value: 'select' },
        { name: 'Pull all rules', value: 'all' },
        { name: 'View rules list first', value: 'list' },
        { name: 'Cancel', value: 'cancel' },
      ],
    },
  ]);

  if (action === 'cancel') {
    return [];
  }

  if (action === 'list') {
    displayRulesList(rules);
    
    const { continueAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'continueAction',
        message: 'Now what would you like to do?',
        choices: [
          { name: 'Select specific rules', value: 'select' },
          { name: 'Pull all rules', value: 'all' },
          { name: 'Cancel', value: 'cancel' },
        ],
      },
    ]);
    
    if (continueAction === 'cancel') {
      return [];
    }
    
    if (continueAction === 'all') {
      return rules;
    }
    // Fall through to select
  } else if (action === 'all') {
    return rules;
  }

  // Interactive selection
  const choices = rules.map((rule, index) => ({
    name: `${rule.title} (${rule.ruleType}, ${rule.isPublic ? 'public' : 'private'})`,
    value: index,
    short: rule.title,
  }));

  const { selectedIndices } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedIndices',
      message: 'Select rules to pull (use spacebar to select, enter to confirm):',
      choices,
      pageSize: 10,
      validate: (answer: number[]) => {
        if (answer.length === 0) {
          return 'You must select at least one rule';
        }
        return true;
      },
    },
  ]);

  return selectedIndices.map((index: number) => rules[index]);
}

function generateFilename(title: string): string {
  // Convert title to a valid filename
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
