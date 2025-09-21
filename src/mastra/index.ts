
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { parsePostgresUrl } from './utils/parse-postgres-url.js';
// Import unified agents
import { mainAgent } from './agents/main-agent.js';
import { emailAgent } from './agents/email-agent.js';
import { calendarAgent } from './agents/calendar-agent.js';
import { webSearchAgent } from './agents/web-search-agent.js';
import { omniAgentMCPServer } from './mcp/omniagent-mcp-server.js';

// Use persistent storage for the unified agent system
const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://localhost/postgres';
if (!postgresUrl) {
  console.warn('POSTGRES_URL or DATABASE_URL not set, using default: postgresql://localhost/postgres');
}

// Parse the connection string into components
const dbConfig = parsePostgresUrl(postgresUrl);

export const mastra = new Mastra({
  workflows: {},
  agents: { 
    // Unified agents
    mainAgent,
    emailAgent,
    calendarAgent,
    webSearchAgent,
  },
  mcpServers: {
    omniAgentMCPServer,
  },
  storage: new PostgresStore(dbConfig),
  logger: new PinoLogger({
    name: 'OmniAgent',
    level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  }),
});
