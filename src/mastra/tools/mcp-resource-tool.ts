import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { 
  getMCPResources, 
  getMCPResourceTemplates,
  readMCPResource,
  subscribeMCPResource,
  unsubscribeMCPResource
} from '../mcp/mcp-config.js';

/**
 * Tool for listing all available MCP resources
 */
export const listMCPResourcesTool = createTool({
  id: 'list-mcp-resources',
  description: 'List all available resources from connected MCP servers',
  inputSchema: z.object({
    serverFilter: z.string().optional().describe('Optional server name to filter resources'),
    mimeTypeFilter: z.string().optional().describe('Optional MIME type to filter resources (e.g., "text/markdown")')
  }),
  outputSchema: z.object({
    resources: z.array(z.object({
      server: z.string(),
      name: z.string(),
      uri: z.string(),
      mimeType: z.string().optional(),
      description: z.string().optional()
    })),
    count: z.number()
  }),
  execute: async ({ context }) => {
    const { serverFilter, mimeTypeFilter } = context;
    
    const allResources = await getMCPResources();
    const flatResources = [];
    
    for (const [serverName, resources] of Object.entries(allResources)) {
      // Apply server filter if provided
      if (serverFilter && serverName !== serverFilter) {
        continue;
      }
      
      if (Array.isArray(resources)) {
        for (const resource of resources) {
          // Apply MIME type filter if provided
          if (mimeTypeFilter && resource.mimeType !== mimeTypeFilter) {
            continue;
          }
          
          flatResources.push({
            server: serverName,
            name: resource.name || 'Unnamed',
            uri: resource.uri,
            mimeType: resource.mimeType,
            description: resource.description
          });
        }
      }
    }
    
    return {
      resources: flatResources,
      count: flatResources.length
    };
  }
});

/**
 * Tool for reading MCP resource content
 */
export const readMCPResourceTool = createTool({
  id: 'read-mcp-resource',
  description: 'Read the content of a specific resource from an MCP server',
  inputSchema: z.object({
    serverName: z.string().describe('The MCP server name'),
    uri: z.string().describe('The resource URI to read')
  }),
  outputSchema: z.object({
    content: z.string().describe('The resource content'),
    mimeType: z.string().optional(),
    metadata: z.any().optional()
  }),
  execute: async ({ context }) => {
    const { serverName, uri } = context;
    
    try {
      const result = await readMCPResource(serverName, uri);
      
      // Extract content based on type
      let content = '';
      const firstContent = result.contents?.[0];
      
      if (firstContent?.text) {
        content = firstContent.text;
      } else if (firstContent?.blob) {
        // Base64 encoded content
        content = `[Binary content, base64 encoded: ${firstContent.blob.substring(0, 50)}...]`;
      }
      
      return {
        content,
        mimeType: firstContent?.mimeType,
        metadata: result.metadata
      };
    } catch (error) {
      throw new Error(`Failed to read resource: ${error}`);
    }
  }
});

/**
 * Tool for discovering MCP resource templates
 */
export const listMCPResourceTemplatesTool = createTool({
  id: 'list-mcp-resource-templates',
  description: 'List all available resource templates from MCP servers for creating dynamic resource URIs',
  inputSchema: z.object({
    serverFilter: z.string().optional().describe('Optional server name to filter templates')
  }),
  outputSchema: z.object({
    templates: z.array(z.object({
      server: z.string(),
      name: z.string(),
      uriTemplate: z.string(),
      description: z.string().optional(),
      mimeType: z.string().optional()
    })),
    count: z.number()
  }),
  execute: async ({ context }) => {
    const { serverFilter } = context;
    
    const allTemplates = await getMCPResourceTemplates();
    const flatTemplates = [];
    
    for (const [serverName, templates] of Object.entries(allTemplates)) {
      // Apply server filter if provided
      if (serverFilter && serverName !== serverFilter) {
        continue;
      }
      
      if (Array.isArray(templates)) {
        for (const template of templates) {
          flatTemplates.push({
            server: serverName,
            name: template.name || 'Unnamed',
            uriTemplate: template.uriTemplate,
            description: template.description,
            mimeType: template.mimeType
          });
        }
      }
    }
    
    return {
      templates: flatTemplates,
      count: flatTemplates.length
    };
  }
});

/**
 * Tool for managing resource subscriptions
 */
export const manageMCPResourceSubscriptionTool = createTool({
  id: 'manage-mcp-resource-subscription',
  description: 'Subscribe or unsubscribe to resource updates from an MCP server',
  inputSchema: z.object({
    action: z.enum(['subscribe', 'unsubscribe']).describe('Action to perform'),
    serverName: z.string().describe('The MCP server name'),
    uri: z.string().describe('The resource URI')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string()
  }),
  execute: async ({ context }) => {
    const { action, serverName, uri } = context;
    
    try {
      if (action === 'subscribe') {
        await subscribeMCPResource(serverName, uri);
        return {
          success: true,
          message: `Successfully subscribed to ${uri} on ${serverName}`
        };
      } else {
        await unsubscribeMCPResource(serverName, uri);
        return {
          success: true,
          message: `Successfully unsubscribed from ${uri} on ${serverName}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to ${action}: ${error}`
      };
    }
  }
});

/**
 * Combined tool for searching resources by content
 */
export const searchMCPResourcesTool = createTool({
  id: 'search-mcp-resources',
  description: 'Search for resources across MCP servers by reading and filtering their content',
  inputSchema: z.object({
    searchTerm: z.string().describe('Term to search for in resource content'),
    mimeType: z.string().optional().describe('Filter by MIME type'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results to return'),
    maxResourcesToScan: z.number().optional().default(100).describe('Upper bound on number of resources to read'),
    serverFilter: z.string().optional().describe('Optional server name to filter before reading'),
    minTextLength: z.number().optional().default(200).describe('Skip resources with content shorter than this after read'),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      server: z.string(),
      name: z.string(),
      uri: z.string(),
      excerpt: z.string(),
      mimeType: z.string().optional()
    })),
    searched: z.number(),
    found: z.number()
  }),
  execute: async ({ context }) => {
    const { searchTerm, mimeType, maxResults, maxResourcesToScan, serverFilter, minTextLength } = context;
    
    // First, get all resources
    const allResources = await getMCPResources();
    const results = [];
    let searched = 0;
    
    for (const [serverName, resources] of Object.entries(allResources)) {
      if (serverFilter && serverName !== serverFilter) continue;
      if (!Array.isArray(resources)) continue;
      
      for (const resource of resources) {
        // Filter by MIME type if specified
        if (mimeType && resource.mimeType !== mimeType) {
          continue;
        }
        
        // Skip binary files
        if (resource.mimeType?.startsWith('image/') || 
            resource.mimeType?.startsWith('video/') ||
            resource.mimeType?.startsWith('audio/')) {
          continue;
        }
        
        // honor scan cap
        if (searched >= (maxResourcesToScan ?? 100)) {
          break;
        }

        searched++;
        
        try {
          // Read the resource content
          const content = await readMCPResource(serverName, resource.uri);
          const text = content.contents?.[0]?.text || '';
          
          // Search for the term (case-insensitive)
          if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
            if (minTextLength && text.length < minTextLength) {
              continue;
            }
            // Find the excerpt around the search term
            const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
            const start = Math.max(0, index - 50);
            const end = Math.min(text.length, index + searchTerm.length + 50);
            const excerpt = text.substring(start, end);
            
            results.push({
              server: serverName,
              name: resource.name || 'Unnamed',
              uri: resource.uri,
              excerpt: (start > 0 ? '...' : '') + excerpt + (end < text.length ? '...' : ''),
              mimeType: resource.mimeType
            });
            
            if (results.length >= maxResults) {
              break;
            }
          }
        } catch (error) {
          // Skip resources that can't be read
          console.warn(`Failed to read ${resource.uri}: ${error}`);
        }
        
        if (results.length >= maxResults) {
          break;
        }
      }
      
      if (results.length >= maxResults) {
        break;
      }
    }
    
    return {
      results,
      searched,
      found: results.length
    };
  }
});
