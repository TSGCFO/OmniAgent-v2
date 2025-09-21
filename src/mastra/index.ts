
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { PgStore } from '@mastra/pg';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
// Import unified agents (will be created next)
import { mainAgent } from './agents/main-agent.js';
import { emailAgent } from './agents/email-agent.js';
import { calendarAgent } from './agents/calendar-agent.js';
import { webSearchAgent } from './agents/web-search-agent.js';
import { omniAgentMCPServer } from './mcp/omniagent-mcp-server.js';

// Use persistent storage for the unified agent system
const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!postgresUrl) {
  throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
}

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { 
    weatherAgent,
    // Unified agents
    mainAgent,
    emailAgent,
    calendarAgent,
    webSearchAgent,
  },
  mcpServers: {
    omniAgentMCPServer,
  },
  storage: new PgStore({
    connectionString: postgresUrl,
  }),
  logger: new PinoLogger({
    name: 'OmniAgent',
    level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  }),
});
