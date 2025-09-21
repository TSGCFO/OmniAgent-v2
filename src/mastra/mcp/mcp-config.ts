import { MCPClient } from '@mastra/mcp';

// MCP client configuration for external integrations
export const createMCPClient = () => {
  // Check for environment variables to determine which servers to connect
  const servers: Record<string, any> = {};
  
  // Rube MCP Server - Pre-built integrations with apps
  if (process.env.RUBE_MCP_TOKEN) {
    servers.rube = {
      url: new URL('https://rube.app/mcp'),
      requestInit: {
        headers: {
          'Authorization': `Bearer ${process.env.RUBE_MCP_TOKEN}`,
        },
      },
    };
  } else {
    console.warn('RUBE_MCP_TOKEN not set - Rube MCP server will not be available');
  }
  
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
    console.log('No MCP servers configured. At minimum, set RUBE_MCP_TOKEN for app integrations.');
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

// ===== MCP Resources Functions =====

// Get all available MCP resources from all servers
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

// Get resource templates from all servers
export async function getMCPResourceTemplates() {
  const client = await getMCPClient();
  if (!client) {
    return {};
  }
  
  try {
    return await client.resources.templates();
  } catch (error) {
    console.error('Failed to get MCP resource templates:', error);
    return {};
  }
}

// Read a specific resource from a server
export async function readMCPResource(serverName: string, uri: string) {
  const client = await getMCPClient();
  if (!client) {
    throw new Error('MCP client not initialized');
  }
  
  try {
    return await client.resources.read(serverName, uri);
  } catch (error) {
    console.error(`Failed to read MCP resource ${uri} from ${serverName}:`, error);
    throw error;
  }
}

// Subscribe to resource updates
export async function subscribeMCPResource(serverName: string, uri: string) {
  const client = await getMCPClient();
  if (!client) {
    throw new Error('MCP client not initialized');
  }
  
  try {
    return await client.resources.subscribe(serverName, uri);
  } catch (error) {
    console.error(`Failed to subscribe to MCP resource ${uri} from ${serverName}:`, error);
    throw error;
  }
}

// Unsubscribe from resource updates
export async function unsubscribeMCPResource(serverName: string, uri: string) {
  const client = await getMCPClient();
  if (!client) {
    throw new Error('MCP client not initialized');
  }
  
  try {
    return await client.resources.unsubscribe(serverName, uri);
  } catch (error) {
    console.error(`Failed to unsubscribe from MCP resource ${uri} from ${serverName}:`, error);
    throw error;
  }
}

// Set up resource update handler
export async function onMCPResourceUpdated(serverName: string, handler: (params: { uri: string }) => void) {
  const client = await getMCPClient();
  if (!client) {
    throw new Error('MCP client not initialized');
  }
  
  try {
    await client.resources.onUpdated(serverName, handler);
  } catch (error) {
    console.error(`Failed to set up resource update handler for ${serverName}:`, error);
    throw error;
  }
}

// Set up resource list change handler
export async function onMCPResourceListChanged(serverName: string, handler: () => void) {
  const client = await getMCPClient();
  if (!client) {
    throw new Error('MCP client not initialized');
  }
  
  try {
    await client.resources.onListChanged(serverName, handler);
  } catch (error) {
    console.error(`Failed to set up resource list change handler for ${serverName}:`, error);
    throw error;
  }
}

// ===== MCP Prompts Functions =====

// Get all available MCP prompts from all servers
export async function getMCPPrompts() {
  const client = await getMCPClient();
  if (!client) {
    return {};
  }
  
  try {
    return await client.prompts.list();
  } catch (error) {
    console.error('Failed to get MCP prompts:', error);
    return {};
  }
}

// Get a specific prompt with its messages
export async function getMCPPrompt(params: {
  serverName: string;
  name: string;
  args?: Record<string, any>;
  version?: string;
}) {
  const client = await getMCPClient();
  if (!client) {
    throw new Error('MCP client not initialized');
  }
  
  try {
    return await client.prompts.get(params);
  } catch (error) {
    console.error(`Failed to get MCP prompt ${params.name} from ${params.serverName}:`, error);
    throw error;
  }
}

// Set up prompt list change handler
export async function onMCPPromptListChanged(serverName: string, handler: () => void) {
  const client = await getMCPClient();
  if (!client) {
    throw new Error('MCP client not initialized');
  }
  
  try {
    await client.prompts.onListChanged(serverName, handler);
  } catch (error) {
    console.error(`Failed to set up prompt list change handler for ${serverName}:`, error);
    throw error;
  }
}

// Cleanup function
export async function disconnectMCP() {
  if (mcpClientInstance) {
    await mcpClientInstance.disconnect();
    mcpClientInstance = null;
  }
}
