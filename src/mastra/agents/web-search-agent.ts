import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { getUnifiedMemory } from '../memory/memory-config.js';
import { getSystemConfig } from '../config/system-config.js';
import { createWebSearchTool } from '../tools/web-search-tool.js';
import { createWebScrapeTool } from '../tools/web-scrape-tool.js';
import { createSourceValidationTool } from '../tools/source-validation-tool.js';

const WEB_SEARCH_AGENT_INSTRUCTIONS = `You are the Web Search Agent, a specialized assistant for finding, analyzing, and synthesizing information from the internet.

## Your Capabilities:
1. **Smart Search**: Perform targeted web searches with optimal query formulation
2. **Information Synthesis**: Combine multiple sources into coherent summaries
3. **Source Validation**: Verify credibility and reliability of sources
4. **Real-time Information**: Access current data, news, and updates
5. **Deep Research**: Conduct thorough research on complex topics

## Search Strategies:
- Use specific, targeted queries for better results
- Search multiple perspectives on controversial topics
- Prioritize authoritative and recent sources
- Cross-reference information from multiple sources
- Identify and filter out misinformation

## Information Processing:
1. **Relevance Filtering**: Focus on information directly answering the query
2. **Fact Checking**: Verify claims across multiple sources
3. **Bias Detection**: Identify and note potential biases in sources
4. **Summary Creation**: Create concise, accurate summaries
5. **Citation Tracking**: Always provide sources for information

## Output Guidelines:
- Provide clear, structured summaries
- Include confidence levels for information
- Cite all sources with titles and URLs
- Highlight any conflicting information found
- Suggest follow-up searches when needed

## Integration:
- Work with Main Agent for complex research tasks
- Provide context for Email and Calendar agents
- Store important findings in memory for future reference

## Best Practices:
- Always verify information from multiple sources
- Be transparent about search limitations
- Update outdated information when found
- Respect copyright and fair use guidelines
- Flag potentially harmful or misleading content`;

export const webSearchAgent = new Agent({
  name: 'WebSearchAgent',
  description: 'Specialized agent for web search, information retrieval, and research synthesis',
  instructions: WEB_SEARCH_AGENT_INSTRUCTIONS,
  model: ({ runtimeContext }) => {
    const config = getSystemConfig();
    const model = runtimeContext?.get('model') || config.agents.subAgentModel;
    return openai(model);
  },
  memory: getUnifiedMemory(),
  tools: {
    searchWeb: createWebSearchTool(),
    scrapeWebPage: createWebScrapeTool(),
    validateSource: createSourceValidationTool(),
  },
  defaultGenerateOptions: ({ runtimeContext }) => {
    const config = getSystemConfig();
    return {
      temperature: 0.5, // Balanced for creative search queries and accurate summaries
      maxSteps: 5, // Allow more steps for thorough research
    };
  },
});

// Web search-specific types
export interface SearchContext {
  searchEngine?: 'google' | 'bing' | 'duckduckgo';
  region?: string;
  language?: string;
  safeSearch?: boolean;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  publishedDate?: Date;
  relevanceScore?: number;
}

export interface ResearchSummary {
  query: string;
  summary: string;
  keyPoints: string[];
  sources: SearchResult[];
  confidence: 'high' | 'medium' | 'low';
  conflictingInfo?: string[];
  followUpSuggestions?: string[];
}

// Helper function for web search operations
export async function performWebResearch(
  query: string,
  userId: string,
  context?: SearchContext
): Promise<ResearchSummary> {
  const response = await webSearchAgent.generate(
    `Research the following topic and provide a comprehensive summary: ${query}`,
    {
      memory: {
        thread: `search-${userId}-${Date.now()}`,
        resource: userId,
      },
      runtimeContext: context ? new Map(Object.entries(context)) : undefined,
    }
  );
  
  // Parse the response into a structured summary
  // In a real implementation, this would use structured output
  return {
    query,
    summary: response.text || '',
    keyPoints: extractKeyPoints(response.text || ''),
    sources: [], // Would be populated from tool calls
    confidence: 'medium',
  };
}

// Helper function to extract key points from text
function extractKeyPoints(text: string): string[] {
  // Simple implementation - in production, use NLP
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 5).map(s => s.trim());
}
