import { Tool } from '@mastra/core/tools';
import { getMCPClient } from '../mcp/mcp-config.js';

/**
 * Dynamically loads tools from MCP servers
 */
export async function loadMCPTools(): Promise<Record<string, Tool>> {
  const mcpClient = await getMCPClient();
  if (!mcpClient) {
    console.warn('No MCP client available - tools will be limited');
    return {};
  }

  try {
    // Get all available tools from MCP servers
    const mcpTools = await mcpClient.getTools();
    
    console.log(`Loaded ${Object.keys(mcpTools).length} tools from MCP servers`);
    return mcpTools;
  } catch (error) {
    console.error('Failed to load MCP tools:', error);
    return {};
  }
}

/**
 * Gets tools for a specific domain (e.g., email, calendar, web)
 */
export async function getMCPToolsForDomain(domain: string): Promise<Record<string, Tool>> {
  const allTools = await loadMCPTools();
  const domainTools: Record<string, Tool> = {};

  // Filter tools based on domain keywords
  const domainKeywords: Record<string, string[]> = {
    email: ['email', 'mail', 'message', 'inbox', 'compose', 'send'],
    calendar: ['calendar', 'event', 'meeting', 'schedule', 'appointment'],
    web: ['web', 'search', 'browse', 'scrape', 'fetch', 'http'],
    weather: ['weather', 'forecast', 'temperature', 'climate'],
  };

  const keywords = domainKeywords[domain] || [domain];

  for (const [toolName, tool] of Object.entries(allTools)) {
    const toolNameLower = toolName.toLowerCase();
    const descriptionLower = (tool.description || '').toLowerCase();
    
    if (keywords.some(keyword => 
      toolNameLower.includes(keyword) || descriptionLower.includes(keyword)
    )) {
      domainTools[toolName] = tool;
    }
  }

  return domainTools;
}

/**
 * Creates a dynamic tool loader function for agents
 */
export function createDynamicToolLoader(domain?: string) {
  return async () => {
    if (domain) {
      return await getMCPToolsForDomain(domain);
    }
    return await loadMCPTools();
  };
}
