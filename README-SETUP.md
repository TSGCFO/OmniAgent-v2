# OmniAgent Setup Guide

## System Architecture

OmniAgent now uses a modern, scalable architecture:

- **PostgreSQL** - For persistent memory storage and vector embeddings
- **Rube MCP Server** - Provides pre-built integrations with 100+ apps
- **Dynamic Tool Loading** - Agents automatically discover and use available tools from MCP servers

## Prerequisites

1. Node.js 20.9.0 or higher
2. PostgreSQL 14 or higher
3. Rube MCP account (sign up at https://rube.app)

## Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd OmniAgent-v2
npm install
```

### 2. PostgreSQL Setup

Install PostgreSQL and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE omniagent;

# Create user (optional)
CREATE USER omniagent_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE omniagent TO omniagent_user;
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Required: OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Required: PostgreSQL Database URL
# Format: postgresql://username:password@host:port/database
POSTGRES_URL=postgresql://postgres:password@localhost:5432/omniagent

# Required: Rube MCP Server Token
# Get your token from https://rube.app
RUBE_MCP_TOKEN=your-rube-mcp-bearer-token-here

# Optional: Log level (debug, info, warn, error)
LOG_LEVEL=info

# Optional: Enable features
ENABLE_SEMANTIC_RECALL=true
ENABLE_WORKING_MEMORY=true

# Optional: Memory configuration
MEMORY_WORKING_SCOPE=resource
MEMORY_SEMANTIC_RECALL_TOPK=5
MEMORY_LAST_MESSAGES_COUNT=20
```

### 4. Rube MCP Setup

1. Sign up at [https://rube.app](https://rube.app)
2. Navigate to your account settings
3. Generate an API token
4. Add the token to your `.env` file as `RUBE_MCP_TOKEN`

## Running the System

### Development Mode

```bash
npm run dev
```

### Quick Start Demo

```bash
npm run quick-start
```

### Interactive Chat

```bash
npm run test:example -- --interactive
```

### Test Main Agent

```bash
npm run test:main
```

## Available Integrations via Rube MCP

The Rube MCP server provides access to 100+ pre-built integrations:

### Communication
- Email (Gmail, Outlook, Yahoo, etc.)
- Calendar (Google Calendar, Outlook Calendar, Apple Calendar)
- Messaging (Slack, Teams, Discord, Telegram)

### Productivity
- Project Management (Jira, Asana, Trello, Monday.com)
- Document Management (Google Drive, Dropbox, OneDrive)
- Note-taking (Notion, Evernote, OneNote)

### Development
- GitHub, GitLab, Bitbucket
- CI/CD (Jenkins, CircleCI, Travis CI)
- Issue Tracking (Linear, Bugzilla)

### Business
- CRM (Salesforce, HubSpot, Pipedrive)
- Accounting (QuickBooks, Xero, FreshBooks)
- E-commerce (Shopify, WooCommerce, Stripe)

### Social & Marketing
- Social Media (Twitter, LinkedIn, Facebook)
- Marketing (Mailchimp, SendGrid, ConvertKit)
- Analytics (Google Analytics, Mixpanel)

## Architecture Benefits

### 1. Scalable Storage
PostgreSQL provides:
- ACID compliance for data integrity
- Advanced indexing for fast vector searches
- Horizontal scalability options
- Robust backup and recovery

### 2. Pre-built Integrations
Rube MCP eliminates the need to:
- Build custom API integrations
- Handle OAuth flows
- Maintain API version compatibility
- Deal with rate limiting and retries

### 3. Dynamic Tool Discovery
Agents automatically:
- Discover available tools at runtime
- Adapt to new integrations without code changes
- Use the best tool for each task
- Handle tool failures gracefully

## Troubleshooting

### PostgreSQL Connection Issues

1. Check if PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify connection string format:
   ```
   postgresql://[user[:password]@][host][:port][/dbname]
   ```

3. Check PostgreSQL logs for errors

### MCP Connection Issues

1. Verify your Rube token is valid
2. Check network connectivity to https://rube.app/mcp
3. Look for error messages in the console
4. Ensure your token has necessary permissions

### Memory System Issues

1. Check if tables were created:
   ```sql
   \dt
   ```

2. Verify pgvector extension is installed:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

## Development Tips

### Adding Custom Tools

While most tools come from MCP, you can still add custom internal tools:

1. Create tool in `src/mastra/tools/`
2. Import in relevant agent
3. Combine with MCP tools in agent configuration

### Monitoring MCP Tools

To see available tools:

```javascript
const { getMCPTools } = await import('./src/mastra/mcp/mcp-config.js');
const tools = await getMCPTools();
console.log('Available tools:', Object.keys(tools));
```

### Database Migrations

The system automatically creates necessary tables on first run. For manual migrations:

```bash
# Connect to database
psql -U postgres -d omniagent

# Run migration scripts as needed
```

## Support

- GitHub Issues: [Report issues here]
- Documentation: See `/docs` folder
- Rube MCP Docs: https://rube.app/docs
