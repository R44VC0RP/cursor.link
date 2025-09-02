import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import open from 'open';
import ora from 'ora';
import { DeviceAuthClient } from './types.js';
import { SecurityManager } from './security.js';

const CONFIG_DIR = path.join(os.homedir(), '.cursor-link');
const TOKEN_FILE = path.join(CONFIG_DIR, 'token.json');

// Default to production URL, but can be overridden via env var
const BASE_URL = process.env.CURSOR_LINK_URL || 'https://cursor.link';

// Validate base URL for security
if (!SecurityManager.validateBaseUrl(BASE_URL)) {
  console.error(chalk.red(`❌ Invalid or insecure base URL: ${BASE_URL}`));
  console.error(chalk.gray('Use HTTPS URLs in production, or localhost for development'));
  process.exit(1);
}

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [deviceAuthorizationClient()],
}) as DeviceAuthClient;

interface StoredToken {
  access_token: string;
  expires_at: number;
  refresh_token?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
  // Persist the server base URL used during authentication so subsequent
  // commands (e.g. status) target the same environment without requiring
  // env vars to be re-set in new shells.
  server_base_url?: string;
}

export class AuthManager {
  private ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  private getBaseUrl(): string {
    // Priority: explicit env var -> persisted token server -> default prod
    if (process.env.CURSOR_LINK_URL && process.env.CURSOR_LINK_URL.trim().length > 0) {
      return process.env.CURSOR_LINK_URL;
    }
    const stored = this.getStoredToken();
    if (stored?.server_base_url && stored.server_base_url.trim().length > 0) {
      return stored.server_base_url;
    }
    return BASE_URL;
  }

  getStoredToken(): StoredToken | null {
    try {
      if (!fs.existsSync(TOKEN_FILE)) {
        return null;
      }
      const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
      
      // Validate token structure
      if (!SecurityManager.validateToken(tokenData)) {
        console.warn(chalk.yellow('⚠️  Invalid token format, clearing...'));
        this.clearToken();
        return null;
      }
      
      // Check if token is expired
      if (SecurityManager.isTokenExpired(tokenData)) {
        this.clearToken();
        return null;
      }
      
      return tokenData;
    } catch (error) {
      const sanitizedError = SecurityManager.sanitizeError(error);
      console.error(`Error reading stored token: ${sanitizedError}`);
      return null;
    }
  }

  saveToken(tokenData: StoredToken) {
    try {
      this.ensureConfigDir();
      console.log('Debug - Writing to file:', TOKEN_FILE);
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
      console.log('Debug - File write successful');
    } catch (error) {
      console.error('Debug - Error saving token:', error);
      throw error;
    }
  }

  clearToken() {
    SecurityManager.clearTokenFile();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }

    try {
      // Verify token by calling Better Auth's get-session endpoint using the
      // Authorization header. If that fails and we're using the default prod
      // URL, try a localhost fallback to assist local development scenarios.
      const baseUrl = this.getBaseUrl();
      const headers = {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      } as Record<string, string>;

      let response = await fetch(`${baseUrl}/api/auth/get-session`, { headers });
      if (response.ok) {
        const text = await response.text();
        if (text && text !== 'null') return true;
      }

      // Fallback only if base URL came from default and no persisted/env base
      const hasExplicitEnv = Boolean(process.env.CURSOR_LINK_URL && process.env.CURSOR_LINK_URL.trim().length > 0);
      const hasPersistedBase = Boolean(token.server_base_url && token.server_base_url.trim().length > 0);
      const fallbackBase = 'http://localhost:3000';
      if (!hasExplicitEnv && !hasPersistedBase && baseUrl === 'https://cursor.link') {
        try {
          response = await fetch(`${fallbackBase}/api/auth/get-session`, { headers });
          if (response.ok) {
            const text = await response.text();
            if (text && text !== 'null') {
              // Persist the discovered base URL so future requests use it
              this.saveToken({ ...token, server_base_url: fallbackBase });
              return true;
            }
          }
        } catch {/* ignore */}
      }
      return false;
    } catch {
      return false;
    }
  }

  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('Not authenticated. Run: cursor-link login');
    }

    const baseUrl = this.getBaseUrl();
    const headers = {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  }

  async login(): Promise<boolean> {
    const spinner = ora('Requesting device authorization...').start();
    
    try {
      const clientId = "cursor-link-cli";
      
      // Validate client_id for security
      if (!SecurityManager.validateClientId(clientId)) {
        spinner.fail('Invalid client ID format');
        return false;
      }
      
      // Request device code (following Better Auth example pattern exactly)
      const { data, error } = await authClient.device.code({
        client_id: clientId,
        scope: "openid profile email",
      });

      if (error || !data) {
        spinner.fail(`Error: ${error?.error_description || 'Failed to get device code'}`);
        console.error('Debug - Full error response:', JSON.stringify(error, null, 2));
        console.error('Debug - Data response:', JSON.stringify(data, null, 2));
        return false;
      }

      const {
        device_code,
        user_code,
        verification_uri,
        verification_uri_complete,
        interval = 5,
      } = data;

      spinner.succeed('Device authorization requested');
      
      console.log(chalk.cyan('\n📱 Device Authorization in Progress'));
      console.log(chalk.white(`Please visit: ${verification_uri}`));
      console.log(chalk.white(`Enter code: ${chalk.bold.yellow(user_code)}\n`));
      
      // Open browser with the complete URL
      const urlToOpen = verification_uri_complete || verification_uri;
      if (urlToOpen) {
        console.log(chalk.gray('🌐 Opening browser...'));
        try {
          await open(urlToOpen);
        } catch (error) {
          console.log(chalk.gray('Failed to open browser automatically. Please visit the URL manually.'));
        }
      }
      
      console.log(chalk.gray(`⏳ Waiting for authorization... (polling every ${interval}s)\n`));

      // Poll for token
      const success = await this.pollForToken(device_code, interval, clientId);
      return success;
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      return false;
    }
  }

  private async pollForToken(deviceCode: string, interval: number, clientId: string): Promise<boolean> {
    let pollingInterval = interval;
    const spinner = ora('Waiting for authorization...').start();
    
    return new Promise((resolve) => {
      const poll = async () => {
        try {
          const { data, error } = await authClient.device.token({
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            device_code: deviceCode,
            client_id: clientId,
          });

          if (data?.access_token) {
            spinner.succeed('✅ Authorization successful!');
            
            console.log('Debug - Token response:', JSON.stringify(data, null, 2));
            
            // The device authorization token is actually a session token from better-auth
            // We need to save it properly to use with API requests
            try {
              // Calculate expiration (default to 7 days if not provided)
              const expiresAt = data.expires_in 
                ? Date.now() + (data.expires_in * 1000)
                : Date.now() + (7 * 24 * 60 * 60 * 1000);

              // Save the session token
              const tokenData = {
                access_token: data.access_token,
                refresh_token: (data as any).refresh_token,
                expires_at: expiresAt,
                user: (data as any).user, // User info might be in the token response
                server_base_url: BASE_URL,
              };
              
              console.log('Debug - Saving token data:', JSON.stringify(tokenData, null, 2));
              this.saveToken(tokenData);
              console.log('Debug - Token saved successfully');

              // Verify token was saved
              const savedToken = this.getStoredToken();
              console.log('Debug - Verified saved token:', savedToken ? 'Found' : 'Not found');

              // Try to get session info for display
              try {
                const { data: session } = await authClient.getSession({
                  fetchOptions: {
                    headers: {
                      Authorization: `Bearer ${data.access_token}`,
                    },
                  },
                });
                console.log(chalk.green(`\nWelcome, ${session?.user?.name || session?.user?.email || 'User'}! 🎉`));
              } catch {
                console.log(chalk.green(`\nAuthentication successful! 🎉`));
              }

              resolve(true);
              return; // Stop polling after successful authentication
            } catch (saveError) {
              console.error('Failed to save token:', saveError);
              resolve(false);
              return; // Stop polling after error
            }
          } else if (error) {
            switch (error.error) {
              case "authorization_pending":
                // Continue polling silently
                break;
              case "slow_down":
                pollingInterval += 5;
                spinner.text = `Slowing down polling to ${pollingInterval}s`;
                break;
              case "access_denied":
                spinner.fail('❌ Access was denied by the user');
                resolve(false);
                return;
              case "expired_token":
                spinner.fail('❌ The device code has expired. Please try again.');
                resolve(false);
                return;
              default:
                spinner.fail(`❌ Error: ${error.error_description}`);
                resolve(false);
                return;
            }
          }
        } catch (err: any) {
          spinner.fail(`❌ Network error: ${err.message}`);
          resolve(false);
          return;
        }

        // Schedule next poll
        setTimeout(poll, pollingInterval * 1000);
      };

      // Start polling
      setTimeout(poll, pollingInterval * 1000);
    });
  }

  async getStatus() {
    const token = this.getStoredToken();
    if (!token) {
      console.log(chalk.red('❌ Not authenticated'));
      console.log(chalk.gray('Run: cursor-link login'));
      return false;
    }

    if (await this.isAuthenticated()) {
      console.log(chalk.green('✅ Authenticated'));
      // Best-effort fetch of session info for display
      try {
        const baseUrl = this.getBaseUrl();
        const resp = await fetch(`${baseUrl}/api/auth/get-session`, {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
          },
        });
        if (resp.ok) {
          const text = await resp.text();
          if (text && text !== 'null') {
            const session = JSON.parse(text);
            const name = session?.user?.name || session?.user?.email || undefined;
            if (name) {
              console.log(chalk.gray(`   User: ${name}`));
            }
          }
        }
      } catch {/* ignore */}
      console.log(chalk.gray(`   Server: ${this.getBaseUrl()}`));
      return true;
    } else {
      console.log(chalk.red('❌ Token expired or invalid'));
      console.log(chalk.gray('Run: cursor-link login'));
      // Do not auto-delete the token file here; keep it for debugging and
      // to allow environment fixes without forcing a fresh login.
      return false;
    }
  }

  async logout() {
    this.clearToken();
    console.log(chalk.green('✅ Logged out successfully'));
  }
}
