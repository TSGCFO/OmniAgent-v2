import { MemoryProcessor, CoreMessage, MemoryProcessorOpts } from '@mastra/core';
import { TokenLimiter, ToolCallFilter } from '@mastra/memory/processors';

// Custom processor for filtering system-level messages
export class SystemMessageFilter extends MemoryProcessor {
  constructor() {
    super({ name: "SystemMessageFilter" });
  }

  process(
    messages: CoreMessage[],
    _opts: MemoryProcessorOpts = {}
  ): CoreMessage[] {
    // Filter out internal system messages while keeping user and assistant messages
    return messages.filter(msg => {
      // Keep user and assistant messages
      if (msg.role === 'user' || msg.role === 'assistant') {
        return true;
      }
      
      // Keep tool messages that contain important context
      if (msg.role === 'tool' && msg.content[0]?.type === 'tool-result') {
        const toolResult = msg.content[0];
        // Keep tool results that have substantial content
        if (typeof toolResult.result === 'string' && toolResult.result.length > 100) {
          return true;
        }
      }
      
      return false;
    });
  }
}

// Custom processor for summarizing old messages
export class MessageSummarizer extends MemoryProcessor {
  private readonly messageAgeThreshold: number;
  
  constructor(messageAgeThreshold: number = 20) {
    super({ name: "MessageSummarizer" });
    this.messageAgeThreshold = messageAgeThreshold;
  }

  process(
    messages: CoreMessage[],
    _opts: MemoryProcessorOpts = {}
  ): CoreMessage[] {
    if (messages.length <= this.messageAgeThreshold) {
      return messages;
    }

    // Separate old and recent messages
    const oldMessages = messages.slice(0, -this.messageAgeThreshold);
    const recentMessages = messages.slice(-this.messageAgeThreshold);

    // Create a summary of old messages
    const summaryContent = this.summarizeMessages(oldMessages);
    
    if (summaryContent) {
      const summaryMessage: CoreMessage = {
        role: 'assistant',
        content: [{
          type: 'text',
          text: `[Summary of previous conversation: ${summaryContent}]`
        }]
      };
      
      return [summaryMessage, ...recentMessages];
    }

    return recentMessages;
  }

  private summarizeMessages(messages: CoreMessage[]): string {
    // Extract key topics and actions from old messages
    const topics = new Set<string>();
    const actions = new Set<string>();
    
    messages.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        const text = msg.content
          .filter(part => part.type === 'text')
          .map(part => (part as any).text)
          .join(' ');
        
        // Simple topic extraction (in production, use NLP)
        if (text.includes('email')) topics.add('email management');
        if (text.includes('calendar') || text.includes('meeting')) topics.add('calendar/scheduling');
        if (text.includes('project')) topics.add('project management');
        if (text.includes('search') || text.includes('find')) topics.add('information retrieval');
      }
    });

    if (topics.size === 0) {
      return '';
    }

    return `Discussed topics: ${Array.from(topics).join(', ')}. ${messages.length} messages exchanged.`;
  }
}

// Create default memory processors for the unified agent
export function createUnifiedMemoryProcessors(): MemoryProcessor[] {
  return [
    // First, filter out system messages
    new SystemMessageFilter(),
    
    // Filter out verbose tool calls (like image generation)
    new ToolCallFilter({ 
      exclude: ['generateImageTool', 'debugTool'] 
    }),
    
    // Summarize very old messages
    new MessageSummarizer(30),
    
    // Finally, apply token limiting (should be last)
    new TokenLimiter(100000), // ~100k tokens for GPT-4
  ];
}
