import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createWebSearchTool = () => createTool({
  id: 'search-web',
  description: 'Search the web for current information, news, and data',
  inputSchema: z.object({
    query: z.string()
      .describe('Search query'),
    options: z.object({
      searchEngine: z.enum(['google', 'bing', 'duckduckgo']).default('google')
        .describe('Search engine to use'),
      region: z.string().optional()
        .describe('Region code for localized results'),
      language: z.string().optional()
        .describe('Language code for results'),
      timeRange: z.enum(['day', 'week', 'month', 'year', 'all']).optional()
        .describe('Time range for results'),
      safeSearch: z.boolean().default(true)
        .describe('Enable safe search filtering'),
      resultCount: z.number().min(1).max(20).default(10)
        .describe('Number of results to return'),
      includeNews: z.boolean().default(false)
        .describe('Include news results'),
      includeImages: z.boolean().default(false)
        .describe('Include image results'),
    }).optional(),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      domain: z.string(),
      publishedDate: z.string().optional(),
      type: z.enum(['web', 'news', 'image', 'video']),
      relevanceScore: z.number().min(0).max(1).optional(),
      metadata: z.object({
        author: z.string().optional(),
        imageUrl: z.string().optional(),
        readTime: z.string().optional(),
      }).optional(),
    })),
    query: z.string(),
    totalResults: z.number().optional(),
    searchTime: z.number()
      .describe('Search time in milliseconds'),
    suggestedQueries: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => {
    const { query, options = {} } = context;
    
    // TODO: Integrate with actual search API (Google Custom Search, Bing API, etc.)
    // This is a placeholder implementation
    
    console.log(`Searching web for: "${query}"`, options);
    
    const startTime = Date.now();
    
    // Simulate search results
    const mockResults = [
      {
        title: `${query} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
        snippet: `${query} is a topic that encompasses various aspects and has been widely discussed...`,
        domain: 'wikipedia.org',
        publishedDate: new Date(Date.now() - 86400000).toISOString(),
        type: 'web' as const,
        relevanceScore: 0.95,
        metadata: {
          readTime: '5 min read',
        },
      },
      {
        title: `Latest News: ${query}`,
        url: `https://news.example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `Breaking news and updates about ${query}. Recent developments show...`,
        domain: 'news.example.com',
        publishedDate: new Date(Date.now() - 3600000).toISOString(),
        type: 'news' as const,
        relevanceScore: 0.88,
        metadata: {
          author: 'News Team',
        },
      },
      {
        title: `Understanding ${query}: A Comprehensive Guide`,
        url: `https://guide.example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `This comprehensive guide covers everything you need to know about ${query}, including...`,
        domain: 'guide.example.com',
        type: 'web' as const,
        relevanceScore: 0.82,
        metadata: {
          readTime: '10 min read',
        },
      },
    ];
    
    // Add news results if requested
    if (options.includeNews) {
      mockResults.push({
        title: `${query} Market Update`,
        url: `https://finance.example.com/news/${Date.now()}`,
        snippet: `Financial analysis of ${query} shows significant market movements...`,
        domain: 'finance.example.com',
        publishedDate: new Date().toISOString(),
        type: 'news' as const,
        relevanceScore: 0.75,
        metadata: {
          author: 'Market Analyst',
        },
      });
    }
    
    // Add image results if requested
    if (options.includeImages) {
      mockResults.push({
        title: `${query} Images`,
        url: `https://images.example.com/search?q=${encodeURIComponent(query)}`,
        snippet: `High-quality images related to ${query}`,
        domain: 'images.example.com',
        type: 'image' as const,
        relevanceScore: 0.70,
        metadata: {
          imageUrl: `https://images.example.com/thumb/${Date.now()}.jpg`,
        },
      });
    }
    
    // Filter by time range if specified
    let filteredResults = mockResults;
    if (options.timeRange && options.timeRange !== 'all') {
      const timeLimit = {
        day: 86400000,
        week: 604800000,
        month: 2592000000,
        year: 31536000000,
      }[options.timeRange];
      
      const cutoffTime = Date.now() - timeLimit;
      filteredResults = mockResults.filter(result => {
        if (!result.publishedDate) return true;
        return new Date(result.publishedDate).getTime() > cutoffTime;
      });
    }
    
    // Limit results
    const finalResults = filteredResults.slice(0, options.resultCount || 10);
    
    // Generate suggested queries
    const suggestedQueries = [
      `${query} tutorial`,
      `${query} best practices`,
      `${query} vs alternatives`,
      `how to ${query}`,
    ];
    
    return {
      results: finalResults,
      query,
      totalResults: Math.floor(Math.random() * 1000000) + 1000,
      searchTime: Date.now() - startTime,
      suggestedQueries,
    };
  },
});
