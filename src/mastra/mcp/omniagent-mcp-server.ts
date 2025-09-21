import { MCPServer } from '@mastra/mcp';
import { mainAgent } from '../agents/main-agent.js';
import { emailAgent } from '../agents/email-agent.js';
import { calendarAgent } from '../agents/calendar-agent.js';
import { webSearchAgent } from '../agents/web-search-agent.js';

// Create MCP server to expose our unified agent system
export const omniAgentMCPServer = new MCPServer({
  name: 'OmniAgent Unified Assistant',
  version: '1.0.0',
  description: 'A comprehensive multi-agent AI assistant that manages digital tasks across platforms',
  
  // Expose our agents as MCP tools
  agents: {
    // Main orchestrator - will be exposed as "ask_omniAgent"
    omniAgent: mainAgent,
    
    // Specialized agents - will be exposed as "ask_[agentName]"
    emailAgent,
    calendarAgent,
    webSearchAgent,
  },
  
  // We can also expose specific tools if needed
  tools: {
    // Add any standalone tools that should be exposed directly
    // For now, agents handle all functionality
  },
  
  // Resources configuration (optional)
  resources: {
    listResources: async () => {
      // List available resources like saved preferences, templates, etc.
      return [
        {
          uri: 'omniagent://preferences',
          name: 'User Preferences',
          mimeType: 'application/json',
          description: 'Stored user preferences and patterns',
        },
        {
          uri: 'omniagent://templates/email',
          name: 'Email Templates',
          mimeType: 'application/json',
          description: 'Common email templates',
        },
        {
          uri: 'omniagent://templates/calendar',
          name: 'Calendar Templates',
          mimeType: 'application/json',
          description: 'Meeting and event templates',
        },
      ];
    },
    
    getResourceContent: async ({ uri }) => {
      // Return resource content based on URI
      switch (uri) {
        case 'omniagent://preferences':
          return {
            text: JSON.stringify({
              emailPreferences: {
                signatureStyle: 'professional',
                defaultCC: [],
                autoArchive: true,
              },
              calendarPreferences: {
                defaultMeetingDuration: 30,
                bufferTime: 15,
                workingHours: { start: '09:00', end: '17:30' },
              },
            }, null, 2),
          };
          
        case 'omniagent://templates/email':
          return {
            text: JSON.stringify({
              templates: [
                {
                  name: 'meeting-followup',
                  subject: 'Follow-up: {meetingTitle}',
                  body: 'Thank you for your time today...',
                },
                {
                  name: 'introduction',
                  subject: 'Introduction: {yourName} from {company}',
                  body: 'I hope this email finds you well...',
                },
              ],
            }, null, 2),
          };
          
        case 'omniagent://templates/calendar':
          return {
            text: JSON.stringify({
              templates: [
                {
                  name: 'standup',
                  title: 'Daily Standup',
                  duration: 15,
                  description: 'Daily team sync',
                },
                {
                  name: 'one-on-one',
                  title: '1:1 with {person}',
                  duration: 30,
                  description: 'Regular check-in',
                },
              ],
            }, null, 2),
          };
          
        default:
          throw new Error(`Resource not found: ${uri}`);
      }
    },
  },
  
  // Prompts configuration (optional)
  prompts: {
    listPrompts: async () => {
      return [
        {
          name: 'daily-planning',
          description: 'Help plan and organize the day',
          version: 'v1',
        },
        {
          name: 'email-management',
          description: 'Process and organize emails efficiently',
          version: 'v1',
        },
        {
          name: 'meeting-prep',
          description: 'Prepare for upcoming meetings',
          version: 'v1',
        },
      ];
    },
    
    getPromptMessages: async ({ name, version, args }) => {
      const prompts = {
        'daily-planning': {
          prompt: {
            name: 'daily-planning',
            description: 'Help plan and organize the day',
            version: 'v1',
          },
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Help me plan my day. ${args?.context || 'Show my calendar, check for important emails, and suggest a prioritized task list.'}`,
              },
            },
          ],
        },
        'email-management': {
          prompt: {
            name: 'email-management',
            description: 'Process and organize emails efficiently',
            version: 'v1',
          },
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Review my emails and help me process them. ${args?.focus || 'Identify urgent items, suggest responses, and organize by priority.'}`,
              },
            },
          ],
        },
        'meeting-prep': {
          prompt: {
            name: 'meeting-prep',
            description: 'Prepare for upcoming meetings',
            version: 'v1',
          },
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Help me prepare for ${args?.meetingName || 'my next meeting'}. ${args?.context || 'Gather relevant emails, documents, and create an agenda.'}`,
              },
            },
          ],
        },
      };
      
      const promptData = prompts[name];
      if (!promptData) {
        throw new Error(`Prompt not found: ${name}`);
      }
      
      return promptData;
    },
  },
});

// Helper to start the MCP server
export async function startOmniAgentMCPServer(mode: 'stdio' | 'sse' | 'http' = 'stdio') {
  switch (mode) {
    case 'stdio':
      await omniAgentMCPServer.startStdio();
      break;
      
    case 'sse':
      // For SSE mode, you'd integrate with your HTTP server
      console.log('SSE mode requires HTTP server integration');
      break;
      
    case 'http':
      // For HTTP mode, you'd integrate with your HTTP server
      console.log('HTTP mode requires HTTP server integration');
      break;
  }
}
