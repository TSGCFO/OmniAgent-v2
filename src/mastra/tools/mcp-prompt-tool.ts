import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { 
  getMCPPrompts,
  getMCPPrompt
} from '../mcp/mcp-config.js';

/**
 * Tool for listing all available MCP prompts
 */
export const listMCPPromptsTool = createTool({
  id: 'list-mcp-prompts',
  description: 'List all available prompts from connected MCP servers',
  inputSchema: z.object({
    serverFilter: z.string().optional().describe('Optional server name to filter prompts'),
    nameFilter: z.string().optional().describe('Optional prompt name pattern to filter')
  }),
  outputSchema: z.object({
    prompts: z.array(z.object({
      server: z.string(),
      name: z.string(),
      description: z.string().optional(),
      version: z.string().optional(),
      arguments: z.any().optional()
    })),
    count: z.number()
  }),
  execute: async ({ context }) => {
    const { serverFilter, nameFilter } = context;
    
    const allPrompts = await getMCPPrompts();
    const flatPrompts = [];
    
    for (const [serverName, prompts] of Object.entries(allPrompts)) {
      // Apply server filter if provided
      if (serverFilter && serverName !== serverFilter) {
        continue;
      }
      
      if (Array.isArray(prompts)) {
        for (const prompt of prompts) {
          // Apply name filter if provided
          if (nameFilter && !prompt.name.toLowerCase().includes(nameFilter.toLowerCase())) {
            continue;
          }
          
          flatPrompts.push({
            server: serverName,
            name: prompt.name,
            description: prompt.description,
            version: prompt.version,
            arguments: prompt.arguments
          });
        }
      }
    }
    
    return {
      prompts: flatPrompts,
      count: flatPrompts.length
    };
  }
});

/**
 * Tool for getting a specific prompt with its messages
 */
export const getMCPPromptTool = createTool({
  id: 'get-mcp-prompt',
  description: 'Get a specific prompt from an MCP server with its messages and execute it with provided arguments',
  inputSchema: z.object({
    serverName: z.string().describe('The MCP server name'),
    promptName: z.string().describe('The prompt name'),
    args: z.record(z.any()).optional().describe('Arguments to pass to the prompt'),
    version: z.string().optional().describe('Specific version of the prompt')
  }),
  outputSchema: z.object({
    prompt: z.object({
      name: z.string(),
      description: z.string().optional(),
      version: z.string().optional()
    }),
    messages: z.array(z.object({
      role: z.string(),
      content: z.any()
    })),
    formattedMessages: z.string().describe('Messages formatted as a conversation')
  }),
  execute: async ({ context }) => {
    const { serverName, promptName, args = {}, version } = context;
    
    try {
      const result = await getMCPPrompt({
        serverName,
        name: promptName,
        args,
        version
      });
      
      // Format messages for easy reading
      let formattedMessages = '';
      result.messages.forEach((msg: any) => {
        formattedMessages += `\n[${msg.role.toUpperCase()}]:\n`;
        
        if (typeof msg.content === 'string') {
          formattedMessages += msg.content + '\n';
        } else if (msg.content?.type === 'text') {
          formattedMessages += msg.content.text + '\n';
        } else {
          formattedMessages += JSON.stringify(msg.content, null, 2) + '\n';
        }
      });
      
      return {
        prompt: {
          name: result.prompt.name,
          description: result.prompt.description,
          version: result.prompt.version
        },
        messages: result.messages,
        formattedMessages: formattedMessages.trim()
      };
    } catch (error) {
      throw new Error(`Failed to get prompt: ${error}`);
    }
  }
});

/**
 * Tool for finding prompts by category or purpose
 */
export const findMCPPromptsTool = createTool({
  id: 'find-mcp-prompts',
  description: 'Find MCP prompts that match a specific category, purpose, or description pattern',
  inputSchema: z.object({
    searchTerm: z.string().describe('Term to search for in prompt names and descriptions'),
    category: z.string().optional().describe('Category of prompts (e.g., "analysis", "generation", "transformation")')
  }),
  outputSchema: z.object({
    matches: z.array(z.object({
      server: z.string(),
      name: z.string(),
      description: z.string().optional(),
      version: z.string().optional(),
      relevance: z.enum(['exact', 'high', 'medium', 'low'])
    })),
    count: z.number()
  }),
  execute: async ({ context }) => {
    const { searchTerm, category } = context;
    
    const allPrompts = await getMCPPrompts();
    const matches = [];
    
    const searchLower = searchTerm.toLowerCase();
    const categoryLower = category?.toLowerCase();
    
    for (const [serverName, prompts] of Object.entries(allPrompts)) {
      if (!Array.isArray(prompts)) continue;
      
      for (const prompt of prompts) {
        const nameLower = prompt.name.toLowerCase();
        const descLower = (prompt.description || '').toLowerCase();
        
        let relevance: 'exact' | 'high' | 'medium' | 'low' | null = null;
        
        // Check for exact matches
        if (nameLower === searchLower || 
            (categoryLower && nameLower.includes(categoryLower))) {
          relevance = 'exact';
        }
        // Check for high relevance (search term in name)
        else if (nameLower.includes(searchLower)) {
          relevance = 'high';
        }
        // Check for medium relevance (search term in description)
        else if (descLower.includes(searchLower)) {
          relevance = 'medium';
        }
        // Check for low relevance (category match in description)
        else if (categoryLower && descLower.includes(categoryLower)) {
          relevance = 'low';
        }
        
        if (relevance) {
          matches.push({
            server: serverName,
            name: prompt.name,
            description: prompt.description,
            version: prompt.version,
            relevance
          });
        }
      }
    }
    
    // Sort by relevance
    const relevanceOrder = { 'exact': 0, 'high': 1, 'medium': 2, 'low': 3 };
    matches.sort((a, b) => relevanceOrder[a.relevance] - relevanceOrder[b.relevance]);
    
    return {
      matches,
      count: matches.length
    };
  }
});

/**
 * Tool for executing a prompt and getting formatted output
 */
export const executeMCPPromptTool = createTool({
  id: 'execute-mcp-prompt',
  description: 'Execute an MCP prompt with specific arguments and return the generated messages in a format ready for use with an LLM',
  inputSchema: z.object({
    serverName: z.string().describe('The MCP server name'),
    promptName: z.string().describe('The prompt name'),
    args: z.record(z.any()).describe('Arguments to pass to the prompt'),
    version: z.string().optional().describe('Specific version of the prompt'),
    additionalContext: z.string().optional().describe('Additional context to append to the prompt messages')
  }),
  outputSchema: z.object({
    messages: z.array(z.object({
      role: z.string(),
      content: z.string()
    })),
    combinedPrompt: z.string().describe('All messages combined into a single prompt string'),
    metadata: z.object({
      server: z.string(),
      promptName: z.string(),
      version: z.string().optional(),
      messageCount: z.number()
    })
  }),
  execute: async ({ context }) => {
    const { serverName, promptName, args, version, additionalContext } = context;
    
    try {
      // Get the prompt
      const result = await getMCPPrompt({
        serverName,
        name: promptName,
        args,
        version
      });
      
      // Convert messages to simple format
      const messages = result.messages.map((msg: any) => {
        let content = '';
        
        if (typeof msg.content === 'string') {
          content = msg.content;
        } else if (msg.content?.type === 'text') {
          content = msg.content.text;
        } else {
          content = JSON.stringify(msg.content);
        }
        
        return {
          role: msg.role,
          content
        };
      });
      
      // Add additional context if provided
      if (additionalContext) {
        messages.push({
          role: 'user',
          content: additionalContext
        });
      }
      
      // Create combined prompt
      let combinedPrompt = '';
      messages.forEach((msg) => {
        combinedPrompt += `### ${msg.role.toUpperCase()}:\n${msg.content}\n\n`;
      });
      
      return {
        messages,
        combinedPrompt: combinedPrompt.trim(),
        metadata: {
          server: serverName,
          promptName,
          version: result.prompt.version,
          messageCount: messages.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to execute prompt: ${error}`);
    }
  }
});

/**
 * Tool for comparing multiple prompts
 */
export const compareMCPPromptsTool = createTool({
  id: 'compare-mcp-prompts',
  description: 'Compare multiple MCP prompts to understand their differences and choose the best one for a task',
  inputSchema: z.object({
    prompts: z.array(z.object({
      serverName: z.string(),
      promptName: z.string(),
      version: z.string().optional()
    })).min(2).max(5).describe('List of prompts to compare (2-5 prompts)'),
    comparisonArgs: z.record(z.any()).optional().describe('Common arguments to use for all prompts')
  }),
  outputSchema: z.object({
    comparison: z.array(z.object({
      server: z.string(),
      name: z.string(),
      version: z.string().optional(),
      description: z.string().optional(),
      messageCount: z.number(),
      messageTypes: z.array(z.string()),
      totalLength: z.number(),
      preview: z.string()
    })),
    recommendations: z.string()
  }),
  execute: async ({ context }) => {
    const { prompts, comparisonArgs = {} } = context;
    
    const comparison = [];
    
    for (const promptRef of prompts) {
      try {
        const result = await getMCPPrompt({
          serverName: promptRef.serverName,
          name: promptRef.promptName,
          args: comparisonArgs,
          version: promptRef.version
        });
        
        // Analyze the prompt
        const messageTypes = [...new Set(result.messages.map((m: any) => m.role))];
        let totalLength = 0;
        let preview = '';
        
        result.messages.forEach((msg: any, index: number) => {
          const content = typeof msg.content === 'string' 
            ? msg.content 
            : msg.content?.text || JSON.stringify(msg.content);
          
          totalLength += content.length;
          
          if (index === 0) {
            preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
          }
        });
        
        comparison.push({
          server: promptRef.serverName,
          name: promptRef.promptName,
          version: result.prompt.version,
          description: result.prompt.description,
          messageCount: result.messages.length,
          messageTypes,
          totalLength,
          preview
        });
      } catch (error) {
        comparison.push({
          server: promptRef.serverName,
          name: promptRef.promptName,
          version: promptRef.version,
          description: `Error: ${error}`,
          messageCount: 0,
          messageTypes: [],
          totalLength: 0,
          preview: 'Failed to load'
        });
      }
    }
    
    // Generate recommendations
    let recommendations = 'Based on the comparison:\n';
    
    // Find shortest and longest
    const sorted = [...comparison].sort((a, b) => a.totalLength - b.totalLength);
    const shortest = sorted[0];
    const longest = sorted[sorted.length - 1];
    
    recommendations += `- Shortest prompt: "${shortest.name}" (${shortest.totalLength} chars)\n`;
    recommendations += `- Longest prompt: "${longest.name}" (${longest.totalLength} chars)\n`;
    
    // Find most complex (most messages)
    const mostComplex = [...comparison].sort((a, b) => b.messageCount - a.messageCount)[0];
    recommendations += `- Most complex: "${mostComplex.name}" (${mostComplex.messageCount} messages)\n`;
    
    // Find prompts with system messages
    const withSystem = comparison.filter(p => p.messageTypes.includes('system'));
    if (withSystem.length > 0) {
      recommendations += `- Prompts with system messages: ${withSystem.map(p => `"${p.name}"`).join(', ')}\n`;
    }
    
    return {
      comparison,
      recommendations
    };
  }
});
