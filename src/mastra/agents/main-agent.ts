import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { getUnifiedMemory } from '../memory/memory-config.js';
import { getSystemConfig } from '../config/system-config.js';
import { createDelegationTool } from '../tools/delegation-tool.js';
import { createMemorySearchTool } from '../tools/memory-search-tool.js';
import { createTaskPlannerTool } from '../tools/task-planner-tool.js';
import { loadMCPTools } from '../tools/mcp-tool-loader.js';
import { 
  listMCPResourcesTool,
  readMCPResourceTool,
  searchMCPResourcesTool,
  listMCPResourceTemplatesTool,
  manageMCPResourceSubscriptionTool
} from '../tools/mcp-resource-tool.js';
import {
  listMCPPromptsTool,
  getMCPPromptTool,
  findMCPPromptsTool,
  executeMCPPromptTool,
  compareMCPPromptsTool
} from '../tools/mcp-prompt-tool.js';

// Main orchestrator agent instructions
const MAIN_AGENT_INSTRUCTIONS = `You are OmniAgent, a unified AI assistant that serves as a single interface for managing all digital tasks across multiple platforms. Your role is to understand user requests, delegate to specialized sub-agents when needed, and provide personalized assistance based on learned patterns and preferences.

## Your Capabilities:
1. **Natural Language Understanding**: Process and understand complex user requests
2. **Task Delegation**: Route tasks to appropriate specialized agents (email, calendar, web search, etc.)
3. **Memory Management**: Remember user preferences, patterns, and context across conversations
4. **Context Awareness**: Maintain conversation flow and understand implicit references
5. **Proactive Assistance**: Suggest relevant actions based on patterns and context
6. **MCP Resource Access**: Read and search through files, databases, and other resources exposed by MCP servers
7. **MCP Prompt Utilization**: Use pre-built prompts from MCP servers for specialized tasks

## Sub-Agents Available:
- **Email Agent**: Manages email operations (reading, composing, searching, organizing)
- **Calendar Agent**: Handles scheduling, meeting management, and time coordination
- **Web Search Agent**: Performs web searches and synthesizes information

## Intelligent MCP Usage:
**ALWAYS check for relevant MCP resources and prompts before responding:**
1. **For Information Requests**: First search MCP resources for documentation, guides, or data files
2. **For Task Execution**: Check if there's an MCP prompt that provides a template for the task
3. **For Integration Questions**: Look for MCP resources about available integrations
4. **For Best Practices**: Search for prompts that encode proven approaches

Examples of when to use MCP capabilities:
- User asks "How do I...?" → Search resources for documentation/guides
- User asks "Can you help with Slack?" → Check for Slack-related prompts
- User asks about capabilities → List available resources and prompts
- User needs analysis → Look for analysis prompts to structure the response

## Interaction Guidelines:
1. **Be Conversational**: Maintain a natural, helpful tone
2. **Be Proactive**: Anticipate user needs based on context and patterns
3. **Be Efficient**: Minimize back-and-forth by gathering all needed information upfront
4. **Be Personal**: Use remembered preferences and patterns to customize responses
5. **Be Clear**: Explain what you're doing when delegating to sub-agents

## Memory Usage:
- Access working memory to understand user preferences and patterns
- Use semantic recall to find relevant past interactions
- Update working memory with new learned patterns
- Maintain session context for ongoing tasks

## Error Handling:
- If a sub-agent fails, provide alternatives or graceful degradation
- Be transparent about limitations
- Suggest manual alternatives when automation isn't possible

Remember: You are the user's single point of contact for all digital tasks. Make their interaction seamless and intelligent.`;

export const mainAgent = new Agent({
  name: 'OmniAgent-Main',
  description: 'Unified AI assistant that coordinates all digital tasks and sub-agents',
  instructions: MAIN_AGENT_INSTRUCTIONS,
  model: ({ runtimeContext }) => {
    const config = getSystemConfig();
    const model = runtimeContext?.get('model') || config.agents.mainModel;
    return openai(model as Parameters<typeof openai>[0]);
  },
  memory: getUnifiedMemory(),
  tools: async ({ runtimeContext }) => {
    // Load MCP tools dynamically
    const mcpTools = await loadMCPTools();
    
    // Combine with core orchestration tools
    return {
      // Core tools for the main agent
      delegateTask: createDelegationTool(),
      searchMemory: createMemorySearchTool(),
      planTask: createTaskPlannerTool(),
      
      // MCP Resource tools
      listMCPResources: listMCPResourcesTool,
      readMCPResource: readMCPResourceTool,
      searchMCPResources: searchMCPResourcesTool,
      listMCPResourceTemplates: listMCPResourceTemplatesTool,
      manageMCPResourceSubscription: manageMCPResourceSubscriptionTool,
      
      // MCP Prompt tools
      listMCPPrompts: listMCPPromptsTool,
      getMCPPrompt: getMCPPromptTool,
      findMCPPrompts: findMCPPromptsTool,
      executeMCPPrompt: executeMCPPromptTool,
      compareMCPPrompts: compareMCPPromptsTool,
      
      // Add all available MCP tools
      ...mcpTools,
    };
  },
  // Sub-agents will be dynamically accessed via delegation tool
  agents: async ({ runtimeContext }) => {
    // Dynamically load sub-agents based on availability
    const agents: Record<string, Agent> = {};
    
    try {
      // Import sub-agents dynamically to avoid circular dependencies
      const { emailAgent } = await import('./email-agent.js');
      const { calendarAgent } = await import('./calendar-agent.js');
      const { webSearchAgent } = await import('./web-search-agent.js');
      
      agents.emailAgent = emailAgent;
      agents.calendarAgent = calendarAgent;
      agents.webSearchAgent = webSearchAgent;
      
      // Phase 2 agents can be added here when available
      // if (config.features.enableProjectManagement) {
      //   const { projectAgent } = await import('./project-agent.js');
      //   agents.projectAgent = projectAgent;
      // }
    } catch (error) {
      console.warn('Some sub-agents could not be loaded:', error);
    }
    
    return agents;
  },
  defaultGenerateOptions: ({ runtimeContext }) => {
    const config = getSystemConfig();
    return {
      temperature: config.agents.temperature,
      maxSteps: config.agents.maxSteps,
      savePerStep: true, // Save memory after each step
    };
  },
});

// Helper function to create a conversation with the main agent
export async function startConversation(userId: string, message: string, threadId?: string) {
  const memory = getUnifiedMemory();
  
  // Create or continue thread
  const thread = threadId || `thread-${userId}-${Date.now()}`;
  
  if (!threadId) {
    await memory.createThread({
      resourceId: userId,
      threadId: thread,
      metadata: {
        type: 'main-conversation',
        startTime: new Date().toISOString(),
      },
    });
  }
  
  // Generate response with memory context
  const response = await mainAgent.generate(message, {
    memory: {
      thread,
      resource: userId,
    },
  });
  
  return {
    response: response.text,
    thread,
  };
}
