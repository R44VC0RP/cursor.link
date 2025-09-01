# cursor-link CLI

A command-line tool to sync your cursor rules with cursor.link.

## Installation

Install globally via npm/pnpm:

```bash
npm install -g cursor-link
# or
pnpm add -g cursor-link
# or run directly with npx
npx cursor-link --help
```

## Quick Start

1. **Authenticate with cursor.link:**
   ```bash
   cursor-link auth login
   ```
   This will open your browser for device authorization.

2. **Push your local cursor rules:**
   ```bash
   cursor-link push
   ```

3. **Pull rules from cursor.link:**
   ```bash
   cursor-link pull
   ```

## Commands

### `cursor-link auth [action]`

Manage authentication with cursor.link.

- `cursor-link auth login` - Sign in using device authorization
- `cursor-link auth logout` - Sign out
- `cursor-link auth status` - Check authentication status

### `cursor-link push [options]`

Push local cursor rules to cursor.link.

**Options:**
- `--public` - Make rules public (default: private)
- `--force` - Overwrite existing rules without confirmation

**Example:**
```bash
cursor-link push --public
```

### `cursor-link pull [options]`

Pull cursor rules from cursor.link to your local project.

**Options:**
- `--list` - List available rules without downloading
- `--all` - Include public rules from other users (default: only your rules)

**Example:**
```bash
cursor-link pull --all --list
```

## How it Works

### Push Process

1. Scans your `.cursor/rules/` directory for `.mdc` files
2. Parses each file to extract title, content, and settings
3. Uploads rules to your cursor.link account
4. Handles conflicts by asking for your preference

### Pull Process

1. Fetches available rules from cursor.link
2. Shows an interactive selection interface
3. Downloads selected rules to `.cursor/rules/`
4. Preserves frontmatter settings like `alwaysApply`

## File Format

The CLI works with cursor rule files in the `.cursor/rules/` directory. Each file should be a `.mdc` file with this format:

```markdown
---
alwaysApply: true
---
# My Rule Title

Rule content goes here...
```

## Environment Variables

- `CURSOR_LINK_URL` - Override the default server URL (default: https://cursor.link)

## Requirements

- Node.js 18+
- A cursor.link account
- Project with `.cursor/rules/` directory

## Authentication

The CLI uses OAuth 2.0 Device Authorization Grant (RFC 8628) for secure authentication. When you run `cursor-link auth login`:

1. A device code is generated
2. Your browser opens to the verification page  
3. You enter the displayed code to authorize the CLI
4. The CLI receives an access token and stores it securely

Your authentication token is stored in `~/.cursor-link/token.json`.

## Troubleshooting

### "Not authenticated" error
Run `cursor-link auth login` to sign in.

### "Cursor rules directory not found"
Make sure you're in a project directory with a `.cursor/rules/` folder.

### Rules not showing up
Check that your `.mdc` files are properly formatted with frontmatter.

### Network errors
Verify your internet connection and that cursor.link is accessible.

## Development

To set up for development:

```bash
git clone <repo>
cd cursor-link-cli
pnpm install
pnpm run build
npm link  # Makes cursor-link command available globally
```
