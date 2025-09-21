import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const createDelegationTool = () => createTool({
  id: 'delegate-task',
  description: 'Delegate a task to a specialized sub-agent for execution',
  inputSchema: z.object({
    agent: z.enum(['email', 'calendar', 'webSearch', 'weather', 'project', 'analytics'])
      .describe('The specialized agent to delegate to'),
    task: z.string()
      .describe('Clear description of the task to be performed'),
    context: z.object({
      priority: z.enum(['low', 'medium', 'high']).optional()
        .describe('Task priority level'),
      deadline: z.string().optional()
        .describe('When the task needs to be completed'),
      relatedInfo: z.record(z.any()).optional()
        .describe('Additional context or parameters for the task'),
    }).optional()
      .describe('Additional context for the task'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    result: z.string().optional(),
    error: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { agent, task, context: taskContext } = context;
    
    try {
      // Import mastra instance
      const { mastra } = await import('../index.js');
      if (!mastra) {
        throw new Error('Mastra instance not initialized');
      }
      
      // Map agent names to actual agent instances
      const agentMap: Record<string, string> = {
        email: 'emailAgent',
        calendar: 'calendarAgent',
        webSearch: 'webSearchAgent',
        weather: 'weatherAgent',
        project: 'projectAgent',
        analytics: 'analyticsAgent',
      };
      
      const agentName = agentMap[agent];
      if (!agentName) {
        throw new Error(`Unknown agent type: ${agent}`);
      }
      
      // Get the specific agent
      const targetAgent = mastra.getAgent(agentName);
      if (!targetAgent) {
        throw new Error(`Agent ${agentName} not found or not initialized`);
      }
      
      // Get memory context from runtime
      const memoryContext = runtimeContext?.get('memoryContext');
      
      // Prepare the delegation message with context
      const delegationMessage = `${task}${
        taskContext ? `\n\nAdditional Context: ${JSON.stringify(taskContext)}` : ''
      }`;
      
      // Execute the task using the sub-agent
      const result = await targetAgent.generate(delegationMessage, {
        memory: memoryContext,
        temperature: 0.7,
        maxSteps: 3,
      });
      
      return {
        success: true,
        result: result.text,
        metadata: {
          agent: agentName,
          executionTime: new Date().toISOString(),
          ...(result.toolCalls ? { toolsUsed: result.toolCalls.map(tc => tc.toolName) } : {}),
        },
      };
    } catch (error) {
      console.error(`Delegation to ${agent} agent failed:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          agent,
          errorTime: new Date().toISOString(),
        },
      };
    }
  },
});
