import chalk from 'chalk';
import { AuthManager } from '../utils/auth-client.js';

const authManager = new AuthManager();

export async function authCommand(action: string) {
  try {
    switch (action.toLowerCase()) {
      case 'login':
        await handleLogin();
        break;
      case 'logout':
        await handleLogout();
        break;
      case 'status':
      default:
        await handleStatus();
        break;
    }
  } catch (error: any) {
    console.error(chalk.red(`❌ ${error.message}`));
    process.exit(1);
  }
}

async function handleLogin() {
  console.log(chalk.cyan('🔐 Starting device authorization flow...\n'));
  
  // Check if already authenticated
  if (await authManager.isAuthenticated()) {
    const token = authManager.getStoredToken();
    console.log(chalk.yellow('⚠️  Already authenticated'));
    if (token?.user) {
      console.log(chalk.gray(`   User: ${token.user.name} (${token.user.email})`));
    }
    console.log(chalk.gray('   Use "cursor-link logout" to sign out first if you want to switch accounts.'));
    return;
  }

  const success = await authManager.login();
  if (success) {
    console.log(chalk.green('\n🎉 Successfully authenticated!'));
    console.log(chalk.gray('You can now use "cursor-link push" and "cursor-link pull" commands.'));
  } else {
    console.log(chalk.red('\n❌ Authentication failed.'));
    console.log(chalk.gray('Please try again or check your internet connection.'));
    process.exit(1);
  }
}

async function handleLogout() {
  if (!(await authManager.isAuthenticated())) {
    console.log(chalk.yellow('⚠️  Not currently authenticated'));
    return;
  }

  await authManager.logout();
}

async function handleStatus() {
  await authManager.getStatus();
}
