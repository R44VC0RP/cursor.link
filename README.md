# cursor.link

> Share and discover Cursor rules – like Gist, but for Cursor IDE rules

**[🚀 Live Demo](https://cursor.link)**

cursor.link is a platform for creating, sharing, and discovering Cursor IDE rules. Create custom rules with different application types, share them with the community, and install them directly via CLI using a shadcn-style registry system.

## ✨ Features

- **🖋️ Rich Rule Editor** - Create cursor rules with live preview and token counting
- **🔄 Rule Types** - Support for Always Apply, Intelligent, File-specific, and Manual rules
- **🔗 Easy Sharing** - Share rules with unique URLs and public/private visibility
- **📦 CLI Integration** - Install rules directly via `npx shadcn add` command
- **👤 User Dashboard** - Manage all your rules in one place
- **🔍 Public Discovery** - Browse and discover community-shared rules in Hot/New feeds
- **📱 CLI Tool** - Full-featured CLI for syncing rules between local and cloud
- **📋 Lists & Collections** - Organize rules into custom lists
- **🎨 Modern UI** - Beautiful dark theme with Tailwind CSS and Radix components

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.2.4** - App Router with React 19
- **TypeScript 5** - Full type safety
- **Tailwind CSS 4.1.9** - Modern styling system
- **Radix UI** - Accessible component primitives
- **React Hook Form + Zod** - Form handling and validation
- **Geist Font** - Modern typography

### Backend
- **PostgreSQL** - Primary database (via Neon.tech)
- **Drizzle ORM 0.44.5** - Type-safe database queries
- **Better Auth 1.3.8-beta.9** - Modern authentication with magic links
- **Inbound Email 4.0.0** - Transactional email service

### Tools & Services
- **Vercel** - Deployment and hosting
- **React Scan 0.4.3** - Performance monitoring
- **Sonner 2.0.7** - Toast notifications
- **Vercel Analytics** - Usage analytics
- **GPT Tokenizer** - Token counting for rules

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Inbound Email account (get your API key from [inbound.new](https://inbound.new))

### Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@host/database"

# Email Service (get from inbound.new)
INBOUND_API_KEY="your_inbound_api_key"

# Auth (automatically generated)
BETTER_AUTH_SECRET="your_auth_secret"
BETTER_AUTH_URL="http://localhost:3000"
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cursor.link.git
   cd cursor.link
   ```

2. **Install dependencies**
   ```bash
   # Using bun (recommended)
   bun install
   
   # Or using npm
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate migrations
   bun run db:generate
   
   # Apply migrations
   bun run db:migrate
   ```

4. **Start the development server**
   ```bash
   bun run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
cursor.link/
├── app/                          # Next.js app directory
│   ├── [userId]/[ruleId]/       # Public rule viewer pages
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── cursor-rules/       # CRUD operations for rules
│   │   ├── feed/               # Hot/New feed endpoints
│   │   ├── lists/              # Lists management
│   │   ├── my-rules/           # User's personal rules
│   │   ├── public-rule/        # Public rule access
│   │   └── registry/           # shadcn-style CLI registry
│   ├── dashboard/              # User dashboard
│   ├── feed/                   # Public feed/discovery page
│   ├── login/                  # Authentication pages
│   └── page.tsx               # Homepage/editor
├── components/                  # Reusable UI components
│   ├── auth/                   # Authentication components
│   ├── dashboard/              # Dashboard components
│   ├── lists/                  # Lists management components
│   ├── ui/                     # Base UI components
│   └── header.tsx             # Site header
├── cursor-link-cli/            # CLI tool package
│   ├── src/                    # CLI source code
│   │   ├── commands/           # CLI commands (auth, push, pull, get)
│   │   └── utils/              # CLI utilities
│   └── package.json           # CLI package configuration
├── lib/                        # Shared utilities
│   ├── auth.ts               # Authentication configuration
│   ├── db.ts                 # Database connection
│   ├── schema.ts             # Database schema
│   └── utils.ts              # Helper utilities
└── drizzle/                    # Database migrations
```

## 🔌 API Reference

### Rules Management

#### Get Rules
```http
GET /api/cursor-rules
GET /api/cursor-rules?ruleId=<id>
```
Fetch all accessible rules or a specific rule by ID.

#### Create Rule
```http
POST /api/cursor-rules
Content-Type: application/json

{
  "title": "my-rule",
  "content": "Rule content...",
  "ruleType": "always|intelligent|specific|manual",
  "isPublic": false
}
```

#### Update Rule
```http
PUT /api/cursor-rules
Content-Type: application/json

{
  "id": "rule-id",
  "title": "updated-title",
  "content": "Updated content...",
  "ruleType": "always",
  "isPublic": true
}
```

### Registry (CLI Integration)

#### Install via CLI
```bash
npx shadcn add https://cursor.link/api/registry/[ruleId]
```

#### Registry Item
```http
GET /api/registry/[ruleId]
```
Returns a shadcn-compatible registry item for CLI installation.

### Public Access

#### View Public Rule
```http
GET /api/public-rule/[userId]/[ruleId]
```
Access a public rule and increment view count.

#### My Rules
```http
GET /api/my-rules
```
Get all rules belonging to the authenticated user.

### Feed & Discovery

#### Hot Feed
```http
GET /api/feed/hot
GET /api/feed/hot?q=search_query
```
Get popular rules sorted by views and engagement.

#### New Feed
```http
GET /api/feed/new
GET /api/feed/new?q=search_query
```
Get recently created rules.

### Lists Management

#### Get Lists
```http
GET /api/lists
```
Get all lists for the authenticated user.

#### Create List
```http
POST /api/lists
Content-Type: application/json

{
  "title": "My List Name"
}
```

#### Add Rules to List
```http
POST /api/lists/[listId]/rules
Content-Type: application/json

{
  "ruleIds": ["rule-id-1", "rule-id-2"]
}
```

## 🎯 Usage

### Creating Rules

1. **Visit the homepage** - Start creating immediately without login
2. **Choose rule type** - Select from Always Apply, Intelligent, File-specific, or Manual
3. **Write your rule** - Use the built-in editor with syntax highlighting and token counting
4. **Save and share** - Login to save privately or share publicly

### Discovering Rules

1. **Visit the Feed** - Browse popular and new rules from the community
2. **Search rules** - Use the search bar to find rules by title, content, or author
3. **View details** - Click on any rule to see full content and metadata
4. **Copy or download** - Use the action buttons to copy content or download as `.mdc` file

### Organizing Rules

1. **Create lists** - Organize your rules into custom collections
2. **Add to lists** - Select multiple rules and add them to lists
3. **Manage collections** - Edit, delete, and organize your lists from the dashboard

### Rule Types

- **Always Apply** - Applied to every chat and cmd-k session
- **Apply Intelligently** - Applied when AI determines relevance
- **Apply to Specific Files** - Applied when file matches specified patterns
- **Apply Manually** - Applied only when @-mentioned

### CLI Installation

Share your rules with the community by making them public, then others can install them directly:

```bash
npx shadcn add https://cursor.link/api/registry/your-rule-id
```

This installs the rule to `~/.cursor/rules/` automatically.

## 📱 CLI Tool

cursor.link includes a powerful CLI tool for syncing rules between your local development environment and the cloud platform.

### Installation

Install the CLI globally:

```bash
npm install -g cursor-link
# or
pnpm add -g cursor-link
# or run directly with npx
npx cursor-link --help
```

### Quick Start

1. **Authenticate with cursor.link:**
   ```bash
   cursor-link auth login
   ```
   This opens your browser for device authorization.

2. **Push your local cursor rules:**
   ```bash
   cursor-link push
   ```

3. **Pull rules from cursor.link:**
   ```bash
   cursor-link pull
   ```

### Commands

#### Authentication
- `cursor-link auth login` - Sign in using device authorization
- `cursor-link auth logout` - Sign out
- `cursor-link auth status` - Check authentication status

#### Rule Management
- `cursor-link push [options]` - Push local cursor rules to cursor.link
  - `--public` - Make rules public (default: private)
  - `--force` - Overwrite existing rules without confirmation
- `cursor-link pull [options]` - Pull cursor rules from cursor.link
  - `--list` - List available rules without downloading
  - `--all` - Include public rules from other users (default: only your rules)
- `cursor-link get <identifier>` - Get a specific rule by slug or ID

### How it Works

#### Push Process
1. Scans your `.cursor/rules/` directory for `.mdc` files
2. Parses each file to extract title, content, and settings
3. Uploads rules to your cursor.link account
4. Handles conflicts by asking for your preference

#### Pull Process
1. Fetches available rules from cursor.link
2. Shows an interactive selection interface
3. Downloads selected rules to `.cursor/rules/`
4. Preserves frontmatter settings like `alwaysApply`

#### File Format
The CLI works with cursor rule files in the `.cursor/rules/` directory. Each file should be a `.mdc` file with this format:

```markdown
---
alwaysApply: true
---
# My Rule Title

Your rule content here...
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/cursor.link.git
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Follow the setup instructions** above to get the project running locally

### Code Style

- **TypeScript** - All new code should be typed
- **ESLint** - Run `npm run lint` before committing
- **Prettier** - Code formatting is enforced
- **Conventional Commits** - Use conventional commit messages

### Contribution Areas

- 🐛 **Bug fixes** - Help improve stability
- ✨ **New features** - Add functionality users want
- 📚 **Documentation** - Improve guides and API docs
- 🎨 **UI/UX** - Enhance the user experience
- ⚡ **Performance** - Optimize loading and responsiveness
- 🔧 **Tooling** - Improve developer experience

### Pull Request Process

1. **Update documentation** for any new features
2. **Add tests** for new functionality
3. **Ensure CI passes** - All checks must be green
4. **Request review** from maintainers
5. **Address feedback** and iterate

### Local Development Tips

- **Hot reload** - Changes reflect immediately in development
- **Database changes** - Run migrations after schema updates
- **Email testing** - Set up Inbound for magic link testing
- **API testing** - Use the built-in API routes for testing

## 🚀 Deployment

### Vercel (Recommended)

1. **Fork the repository**
2. **Import to Vercel** from your GitHub account
3. **Add environment variables** in Vercel dashboard
4. **Deploy** - Automatic deployments on every push

### Environment Variables for Production

```bash
# Database (production)
DATABASE_URL="postgresql://prod_user:password@host/database"

# Email Service
INBOUND_API_KEY="your_production_api_key"

# Auth
BETTER_AUTH_SECRET="your_secure_random_string"
BETTER_AUTH_URL="https://your-domain.com"
```

### Custom Deployment

The app is a standard Next.js application and can be deployed to any platform that supports Node.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Digital Ocean App Platform**
- **AWS Amplify**

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **[Cursor](https://cursor.sh)** - For creating an amazing AI-powered IDE
- **[shadcn/ui](https://ui.shadcn.com)** - For the incredible component library
- **[v0.dev](https://v0.dev)** - For rapid prototyping assistance
- **[Vercel](https://vercel.com)** - For seamless deployment
- **[Neon](https://neon.tech)** - For serverless PostgreSQL

---

Built with ❤️ for the Cursor community. [Share your rules](https://cursor.link) today!