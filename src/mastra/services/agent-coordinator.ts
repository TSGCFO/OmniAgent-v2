import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { getUnifiedMemory, createMemoryContext } from '../memory/memory-config.js';
import { mastra } from '../index.js';

// Types for coordination
export interface CoordinationRequest {
  userId: string;
  message: string;
  context?: {
    thread?: string;
    priority?: 'low' | 'medium' | 'high';
    timeout?: number;
  };
}

export interface CoordinationResult {
  success: boolean;
  response: string;
  thread: string;
  agentsUsed: string[];
  executionTime: number;
  metadata?: Record<string, any>;
}

export interface TaskAnalysis {
  primaryIntent: string;
  requiredAgents: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedSteps: number;
  suggestedApproach: string;
}

// Agent coordinator service
export class AgentCoordinator {
  private mainAgent: Agent;
  private memory = getUnifiedMemory();
  
  constructor() {
    this.mainAgent = mastra.getAgent('mainAgent');
  }
  
  /**
   * Process a user request through the unified agent system
   */
  async processRequest(request: CoordinationRequest): Promise<CoordinationResult> {
    const startTime = Date.now();
    const { userId, message, context } = request;
    
    try {
      // Create or get thread
      const thread = context?.thread || await this.createThread(userId);
      
      // Create runtime context with necessary information
      const runtimeContext = new RuntimeContext();
      runtimeContext.set('mastra', mastra);
      runtimeContext.set('userId', userId);
      runtimeContext.set('priority', context?.priority || 'medium');
      runtimeContext.set('memoryContext', createMemoryContext(userId, thread));
      
      // Analyze the task to determine approach
      const analysis = await this.analyzeTask(message);
      
      // Log task analysis
      console.log('Task Analysis:', analysis);
      
      // Execute through main agent with proper context
      const response = await this.mainAgent.generate(message, {
        memory: {
          thread,
          resource: userId,
        },
        runtimeContext,
        maxSteps: analysis.estimatedSteps + 2, // Add buffer
        temperature: 0.7,
      });
      
      // Extract agents used from the response
      const agentsUsed = this.extractAgentsUsed(response);
      
      return {
        success: true,
        response: response.text || 'Task completed successfully',
        thread,
        agentsUsed,
        executionTime: Date.now() - startTime,
        metadata: {
          analysis,
          toolCalls: response.toolCalls?.length || 0,
        },
      };
    } catch (error) {
      console.error('Coordination error:', error);
      
      return {
        success: false,
        response: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        thread: context?.thread || '',
        agentsUsed: [],
        executionTime: Date.now() - startTime,
        metadata: {
          error: error instanceof Error ? error.stack : String(error),
        },
      };
    }
  }
  
  /**
   * Analyze a task to determine the best approach
   */
  private async analyzeTask(message: string): Promise<TaskAnalysis> {
    const lowerMessage = message.toLowerCase();
    const requiredAgents: Set<string> = new Set(['mainAgent']);
    
    // Determine required agents based on keywords
    if (lowerMessage.includes('email') || lowerMessage.includes('send') || lowerMessage.includes('reply')) {
      requiredAgents.add('emailAgent');
    }
    
    if (lowerMessage.includes('meeting') || lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
      requiredAgents.add('calendarAgent');
    }
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('research')) {
      requiredAgents.add('webSearchAgent');
    }
    
    if (lowerMessage.includes('weather') || lowerMessage.includes('forecast')) {
      requiredAgents.add('weatherAgent');
    }
    
    // Determine complexity
    const agentCount = requiredAgents.size;
    const hasMultipleActions = (message.match(/\band\b/g) || []).length > 1;
    const wordCount = message.split(' ').length;
    
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (agentCount > 3 || hasMultipleActions || wordCount > 50) {
      complexity = 'complex';
    } else if (agentCount > 1 || wordCount > 20) {
      complexity = 'moderate';
    }
    
    // Estimate steps
    const estimatedSteps = Math.max(3, agentCount * 2);
    
    // Determine primary intent
    let primaryIntent = 'general assistance';
    if (requiredAgents.has('emailAgent')) primaryIntent = 'email management';
    else if (requiredAgents.has('calendarAgent')) primaryIntent = 'scheduling';
    else if (requiredAgents.has('webSearchAgent')) primaryIntent = 'information retrieval';
    
    // Suggest approach
    const suggestedApproach = complexity === 'complex' 
      ? 'Break down into subtasks and coordinate multiple agents'
      : complexity === 'moderate'
      ? 'Delegate to specialized agents with coordination'
      : 'Direct execution by primary agent';
    
    return {
      primaryIntent,
      requiredAgents: Array.from(requiredAgents),
      complexity,
      estimatedSteps,
      suggestedApproach,
    };
  }
  
  /**
   * Create a new conversation thread
   */
  private async createThread(userId: string): Promise<string> {
    const thread = await this.memory.createThread({
      resourceId: userId,
      title: 'Unified Assistant Conversation',
      metadata: {
        createdBy: 'AgentCoordinator',
        timestamp: new Date().toISOString(),
      },
    });
    
    return thread.id;
  }
  
  /**
   * Extract which agents were used from the response
   */
  private extractAgentsUsed(response: any): string[] {
    const agentsUsed = new Set<string>(['mainAgent']);
    
    // Check tool calls for delegation
    if (response.toolCalls) {
      response.toolCalls.forEach((call: any) => {
        if (call.toolName === 'delegate-task' && call.args?.agent) {
          agentsUsed.add(`${call.args.agent}Agent`);
        }
      });
    }
    
    return Array.from(agentsUsed);
  }
  
  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId: string, threadId?: string, limit: number = 10) {
    try {
      const threads = threadId 
        ? [{ id: threadId, resourceId: userId }]
        : await this.memory.getThreadsByResourceId({ 
            resourceId: userId,
            sortDirection: 'DESC',
          });
      
      if (threads.length === 0) {
        return [];
      }
      
      const targetThread = threads[0];
      const { uiMessages } = await this.memory.query({
        threadId: targetThread.id,
        resourceId: userId,
        selectBy: {
          last: limit,
        },
      });
      
      return uiMessages;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }
  
  /**
   * Clear conversation history for a user
   */
  async clearConversationHistory(userId: string, threadId?: string): Promise<boolean> {
    try {
      if (threadId) {
        // Clear specific thread
        const { uiMessages } = await this.memory.query({
          threadId,
          resourceId: userId,
        });
        
        const messageIds = uiMessages.map((msg: any) => msg.id).filter(Boolean);
        if (messageIds.length > 0) {
          await this.memory.deleteMessages(messageIds);
        }
      } else {
        // Clear all threads for user
        const threads = await this.memory.getThreadsByResourceId({
          resourceId: userId,
        });
        
        for (const thread of threads) {
          const { uiMessages } = await this.memory.query({
            threadId: thread.id,
            resourceId: userId,
          });
          
          const messageIds = uiMessages.map((msg: any) => msg.id).filter(Boolean);
          if (messageIds.length > 0) {
            await this.memory.deleteMessages(messageIds);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      return false;
    }
  }
}

// Export singleton instance
export const agentCoordinator = new AgentCoordinator();
