import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getUnifiedMemory } from '../memory/memory-config.js';

export const createMemorySearchTool = () => createTool({
  id: 'search-memory',
  description: 'Search through conversation history and remembered information to find relevant context',
  inputSchema: z.object({
    query: z.string()
      .describe('What to search for in memory'),
    searchType: z.enum(['semantic', 'recent', 'pattern'])
      .describe('Type of search to perform')
      .default('semantic'),
    options: z.object({
      limit: z.number().min(1).max(50).default(10)
        .describe('Maximum number of results to return'),
      dateRange: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
      }).optional()
        .describe('Date range to search within'),
      includeWorkingMemory: z.boolean().default(true)
        .describe('Whether to include working memory in results'),
    }).optional(),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      type: z.enum(['message', 'pattern', 'preference', 'context']),
      content: z.string(),
      timestamp: z.string().optional(),
      relevanceScore: z.number().min(0).max(1).optional(),
      metadata: z.record(z.any()).optional(),
    })),
    summary: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { query, searchType, options = {} } = context;
    const memory = getUnifiedMemory();
    
    try {
      const memoryContext = runtimeContext?.get('memoryContext');
      if (!memoryContext?.thread) {
        throw new Error('Memory context not available');
      }
      
      const results: any[] = [];
      
      if (searchType === 'semantic' || searchType === 'recent') {
        // Query messages with semantic search
        const { messages, uiMessages } = await memory.query({
          threadId: memoryContext.thread,
          resourceId: memoryContext.resource,
          selectBy: {
            vectorSearchString: searchType === 'semantic' ? query : undefined,
            last: searchType === 'recent' ? options.limit || 10 : undefined,
            pagination: options.dateRange ? {
              dateRange: {
                start: options.dateRange.start ? new Date(options.dateRange.start) : undefined,
                end: options.dateRange.end ? new Date(options.dateRange.end) : undefined,
              },
            } : undefined,
          },
        });
        
        // Process messages into results
        uiMessages.forEach((msg: any) => {
          const content = msg.content?.map((c: any) => 
            c.type === 'text' ? c.text : `[${c.type}]`
          ).join(' ') || '';
          
          results.push({
            type: 'message',
            content: content.substring(0, 500), // Truncate long messages
            timestamp: msg.createdAt || new Date().toISOString(),
            metadata: {
              role: msg.role,
              id: msg.id,
            },
          });
        });
      }
      
      if (searchType === 'pattern' && options.includeWorkingMemory) {
        // Extract patterns from working memory
        // In a real implementation, this would parse the working memory template
        const workingMemoryPatterns = {
          type: 'pattern',
          content: 'User preferences and patterns from working memory',
          metadata: {
            source: 'working_memory',
          },
        };
        results.push(workingMemoryPatterns);
      }
      
      // Generate summary if needed
      let summary: string | undefined;
      if (results.length > 5) {
        summary = `Found ${results.length} relevant items for "${query}". ` +
          `Most relevant content relates to recent conversations and stored patterns.`;
      }
      
      return {
        results: results.slice(0, options.limit || 10),
        summary,
      };
    } catch (error) {
      console.error('Memory search failed:', error);
      return {
        results: [],
        summary: 'Memory search encountered an error',
      };
    }
  },
});
