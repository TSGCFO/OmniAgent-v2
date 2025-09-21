import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { 
  getMCPResources, 
  getMCPPrompts,
  readMCPResource,
  getMCPPrompt
} from '../mcp/mcp-config.js';

/**
 * Intelligent helper tool that proactively checks for relevant MCP resources and prompts
 * based on the user's query context
 */
export const intelligentMCPHelperTool = createTool({
  id: 'intelligent-mcp-helper',
  description: 'Intelligently finds relevant MCP resources and prompts based on the user query context. Always use this at the start of handling any user request.',
  inputSchema: z.object({
    userQuery: z.string().describe('The user\'s original query or request'),
    queryType: z.enum(['information', 'task', 'integration', 'analysis', 'general']).optional()
      .describe('Type of query to help narrow search')
  }),
  outputSchema: z.object({
    relevantResources: z.array(z.object({
      server: z.string(),
      name: z.string(),
      uri: z.string(),
      relevanceReason: z.string()
    })),
    relevantPrompts: z.array(z.object({
      server: z.string(),
      name: z.string(),
      description: z.string().optional(),
      relevanceReason: z.string()
    })),
    suggestions: z.array(z.string()),
    shouldUseResources: z.boolean(),
    shouldUsePrompts: z.boolean()
  }),
  execute: async ({ context }) => {
    const { userQuery, queryType } = context;
    
    // Extract keywords from the query
    const keywords = extractKeywords(userQuery);
    
    // Get all available resources and prompts
    const allResources = await getMCPResources();
    const allPrompts = await getMCPPrompts();
    
    // Find relevant resources
    const relevantResources: Array<{
      server: string;
      name: string;
      uri: string;
      relevanceReason: string;
    }> = [];
    for (const [server, resources] of Object.entries(allResources)) {
      if (!Array.isArray(resources)) continue;
      
      for (const resource of resources) {
        const relevance = calculateResourceRelevance(resource, keywords, queryType);
        if (relevance.score > 0.3) {
          relevantResources.push({
            server,
            name: resource.name || resource.uri,
            uri: resource.uri,
            relevanceReason: relevance.reason
          });
        }
      }
    }
    
    // Find relevant prompts
    const relevantPrompts: Array<{
      server: string;
      name: string;
      description: string | undefined;
      relevanceReason: string;
    }> = [];
    for (const [server, prompts] of Object.entries(allPrompts)) {
      if (!Array.isArray(prompts)) continue;
      
      for (const prompt of prompts) {
        const relevance = calculatePromptRelevance(prompt, keywords, queryType);
        if (relevance.score > 0.3) {
          relevantPrompts.push({
            server,
            name: prompt.name,
            description: prompt.description,
            relevanceReason: relevance.reason
          });
        }
      }
    }
    
    // Sort by relevance (assuming relevance info is in the reason)
    relevantResources.sort((a, b) => b.relevanceReason.length - a.relevanceReason.length);
    relevantPrompts.sort((a, b) => b.relevanceReason.length - a.relevanceReason.length);
    
    // Generate suggestions based on findings
    const suggestions = generateSuggestions(
      userQuery, 
      relevantResources, 
      relevantPrompts,
      queryType
    );
    
    return {
      relevantResources: relevantResources.slice(0, 5), // Top 5
      relevantPrompts: relevantPrompts.slice(0, 5), // Top 5
      suggestions,
      shouldUseResources: relevantResources.length > 0,
      shouldUsePrompts: relevantPrompts.length > 0
    };
  }
});

// Helper functions

function extractKeywords(query: string): string[] {
  // Remove common words and extract meaningful keywords
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'can', 'you', 'help', 'me', 'how', 'what',
    'when', 'where', 'why', 'is', 'are', 'do', 'does', 'please'
  ]);
  
  const words = query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
  
  // Also extract phrases for known integrations
  const integrationKeywords: string[] = [];
  const integrations = ['slack', 'github', 'jira', 'notion', 'google', 'salesforce', 'hubspot'];
  
  for (const integration of integrations) {
    if (query.toLowerCase().includes(integration)) {
      integrationKeywords.push(integration);
    }
  }
  
  return [...new Set([...words, ...integrationKeywords])];
}

function calculateResourceRelevance(
  resource: any,
  keywords: string[],
  queryType?: string
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  
  const resourceText = `${resource.name || ''} ${resource.uri || ''} ${resource.description || ''}`.toLowerCase();
  
  // Check keyword matches
  for (const keyword of keywords) {
    if (resourceText.includes(keyword)) {
      score += 0.2;
      reasons.push(`Contains keyword: ${keyword}`);
    }
  }
  
  // Check for documentation resources
  if (queryType === 'information' && 
      (resource.mimeType === 'text/markdown' || 
       resource.uri?.includes('doc') ||
       resource.name?.includes('guide'))) {
    score += 0.3;
    reasons.push('Documentation resource');
  }
  
  // Check for configuration files
  if (resource.uri?.includes('config') || resource.uri?.includes('settings')) {
    score += 0.2;
    reasons.push('Configuration resource');
  }
  
  // Check for example/template files
  if (resource.uri?.includes('example') || resource.uri?.includes('template')) {
    score += 0.25;
    reasons.push('Example/template resource');
  }
  
  return {
    score: Math.min(score, 1),
    reason: reasons.join(', ') || 'General match'
  };
}

function calculatePromptRelevance(
  prompt: any,
  keywords: string[],
  queryType?: string
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  
  const promptText = `${prompt.name || ''} ${prompt.description || ''}`.toLowerCase();
  
  // Check keyword matches
  for (const keyword of keywords) {
    if (promptText.includes(keyword)) {
      score += 0.25;
      reasons.push(`Contains keyword: ${keyword}`);
    }
  }
  
  // Check for specific prompt types
  if (queryType === 'analysis' && promptText.includes('analysis')) {
    score += 0.4;
    reasons.push('Analysis prompt');
  }
  
  if (queryType === 'task' && 
      (promptText.includes('create') || 
       promptText.includes('generate') ||
       promptText.includes('build'))) {
    score += 0.3;
    reasons.push('Task execution prompt');
  }
  
  // Check for integration-specific prompts
  const integrations = ['slack', 'github', 'jira', 'notion', 'salesforce'];
  for (const integration of integrations) {
    if (promptText.includes(integration) && keywords.includes(integration)) {
      score += 0.5;
      reasons.push(`${integration} integration prompt`);
    }
  }
  
  // Check for general-purpose prompts
  if (prompt.name === 'get-started' || prompt.name === 'help') {
    score += 0.1;
    reasons.push('General help prompt');
  }
  
  return {
    score: Math.min(score, 1),
    reason: reasons.join(', ') || 'General match'
  };
}

function generateSuggestions(
  query: string,
  resources: any[],
  prompts: any[],
  queryType?: string
): string[] {
  const suggestions: string[] = [];
  
  if (resources.length > 0) {
    suggestions.push(`Found ${resources.length} relevant resources that might help with your request`);
    
    // Suggest reading documentation first
    const docs = resources.filter(r => 
      r.name.includes('doc') || 
      r.name.includes('guide') || 
      r.uri.includes('.md')
    );
    if (docs.length > 0) {
      suggestions.push('Consider checking the documentation resources first for guidance');
    }
  }
  
  if (prompts.length > 0) {
    suggestions.push(`Found ${prompts.length} relevant prompts that can structure the response`);
    
    // Suggest specific prompts based on query type
    const analysisPrompts = prompts.filter(p => p.name.includes('analysis'));
    if (analysisPrompts.length > 0 && query.toLowerCase().includes('analyz')) {
      suggestions.push('Use an analysis prompt for a comprehensive structured analysis');
    }
    
    const integrationPrompts = prompts.filter(p => 
      p.name.includes('slack') || 
      p.name.includes('github') ||
      p.description?.includes('integration')
    );
    if (integrationPrompts.length > 0) {
      suggestions.push('Integration-specific prompts are available for better results');
    }
  }
  
  if (resources.length === 0 && prompts.length === 0) {
    suggestions.push('No directly relevant MCP resources or prompts found');
    suggestions.push('Proceeding with general knowledge and available tools');
  }
  
  return suggestions;
}
