
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
// Import unified agents (will be created next)
import { mainAgent } from './agents/main-agent.js';
import { emailAgent } from './agents/email-agent.js';
import { calendarAgent } from './agents/calendar-agent.js';
import { webSearchAgent } from './agents/web-search-agent.js';
import { omniAgentMCPServer } from './mcp/omniagent-mcp-server.js';

// Use persistent storage for the unified agent system
const databaseUrl = process.env.DATABASE_URL || 'file:./data/omniagent.db';

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
  storage: new LibSQLStore({
    url: databaseUrl,
  }),
  logger: new PinoLogger({
    name: 'OmniAgent',
    level: process.env.LOG_LEVEL || 'info',
  }),
});
