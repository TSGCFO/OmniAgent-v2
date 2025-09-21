import { MCPClient } from '@mastra/mcp';

// MCP client configuration for external integrations
export const createMCPClient = () => {
  // Check for environment variables to determine which servers to connect
  const servers: Record<string, any> = {};
  
  // Weather MCP Server (example)
  if (process.env.MCP_WEATHER_SERVER_URL) {
    servers.weather = {
      url: new URL(process.env.MCP_WEATHER_SERVER_URL),
      requestInit: {
        headers: {
          'Authorization': process.env.MCP_WEATHER_API_KEY ? `Bearer ${process.env.MCP_WEATHER_API_KEY}` : undefined,
        },
      },
    };
  }
  
  // Email MCP Server (if available)
  if (process.env.MCP_EMAIL_SERVER_URL) {
    servers.email = {
      url: new URL(process.env.MCP_EMAIL_SERVER_URL),
      requestInit: {
        headers: {
          'Authorization': process.env.MCP_EMAIL_API_KEY ? `Bearer ${process.env.MCP_EMAIL_API_KEY}` : undefined,
        },
      },
    };
  }
  
  // Calendar MCP Server (if available)
  if (process.env.MCP_CALENDAR_SERVER_URL) {
    servers.calendar = {
      url: new URL(process.env.MCP_CALENDAR_SERVER_URL),
      requestInit: {
        headers: {
          'Authorization': process.env.MCP_CALENDAR_API_KEY ? `Bearer ${process.env.MCP_CALENDAR_API_KEY}` : undefined,
        },
      },
    };
  }
  
  // File system MCP server (local example)
  if (process.env.ENABLE_FILESYSTEM_MCP === 'true') {
    servers.filesystem = {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        process.env.FILESYSTEM_MCP_PATH || process.cwd(),
      ],
    };
  }
  
  // GitHub MCP server (example)
  if (process.env.GITHUB_TOKEN) {
    servers.github = {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-github',
      ],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      },
    };
  }
  
  // Only create client if we have servers configured
  if (Object.keys(servers).length === 0) {
    console.log('No MCP servers configured. Add server URLs to environment variables.');
    return null;
  }
  
  return new MCPClient({
    servers,
    timeout: 30000, // 30 second timeout
  });
};

// Singleton instance
let mcpClientInstance: MCPClient | null = null;

export async function getMCPClient(): Promise<MCPClient | null> {
  if (!mcpClientInstance) {
    mcpClientInstance = createMCPClient();
  }
  return mcpClientInstance;
}

// Get all available MCP tools
export async function getMCPTools() {
  const client = await getMCPClient();
  if (!client) {
    return {};
  }
  
  try {
    return await client.getTools();
  } catch (error) {
    console.error('Failed to get MCP tools:', error);
    return {};
  }
}

// Get MCP resources
export async function getMCPResources() {
  const client = await getMCPClient();
  if (!client) {
    return {};
  }
  
  try {
    return await client.resources.list();
  } catch (error) {
    console.error('Failed to get MCP resources:', error);
    return {};
  }
}

// Cleanup function
export async function disconnectMCP() {
  if (mcpClientInstance) {
    await mcpClientInstance.disconnect();
    mcpClientInstance = null;
  }
}
