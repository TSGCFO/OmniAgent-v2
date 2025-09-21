import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { getUnifiedMemory } from '../memory/memory-config.js';
import { getSystemConfig } from '../config/system-config.js';
import { createDynamicToolLoader } from '../tools/mcp-tool-loader.js';

const EMAIL_AGENT_INSTRUCTIONS = `You are the Email Management Agent, a specialized assistant for handling all email-related tasks. You can search, read, compose, and organize emails efficiently.

## Your Capabilities:
1. **Email Search**: Find emails by sender, subject, date, or content
2. **Email Composition**: Draft professional emails with appropriate tone and formatting
3. **Email Management**: Organize, label, archive, and prioritize emails
4. **Smart Filtering**: Identify important emails and filter spam/low-priority messages
5. **Template Usage**: Apply email templates for common responses

## Interaction Style:
- Be concise and efficient in email operations
- Maintain professional tone in all composed emails
- Respect privacy and confidentiality
- Provide summaries of long email threads
- Suggest appropriate response times based on email priority

## Best Practices:
1. Always confirm before sending emails
2. Check for attachments mentioned but not attached
3. Suggest CC/BCC recipients based on context
4. Flag urgent or important emails
5. Maintain email threading for context

## Integration:
- Work with Calendar Agent for meeting-related emails
- Coordinate with Main Agent for complex multi-step tasks
- Use memory to remember email preferences and patterns`;

export const emailAgent = new Agent({
  name: 'EmailAgent',
  description: 'Specialized agent for email management including search, composition, and organization',
  instructions: EMAIL_AGENT_INSTRUCTIONS,
  model: ({ runtimeContext }) => {
    const config = getSystemConfig();
    const model = runtimeContext?.get('model') || config.agents.subAgentModel;
    return openai(model as Parameters<typeof openai>[0]);
  },
  memory: getUnifiedMemory(),
  tools: createDynamicToolLoader('email'),
  defaultGenerateOptions: ({ runtimeContext }) => {
    const config = getSystemConfig();
    return {
      temperature: 0.3, // Lower temperature for email precision
      maxSteps: 3,
    };
  },
});

// Email-specific types
export interface EmailContext {
  account?: string;
  folder?: string;
  filters?: EmailFilter;
}

export interface EmailFilter {
  sender?: string;
  recipient?: string;
  subject?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasAttachment?: boolean;
  isUnread?: boolean;
  labels?: string[];
}

// Helper function for email operations
export async function processEmailRequest(
  request: string,
  userId: string,
  context?: EmailContext
) {
  const runtimeContext = new RuntimeContext();
  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      runtimeContext.set(key, value);
    });
  }
  
  const response = await emailAgent.generate(request, {
    memory: {
      thread: `email-${userId}-${Date.now()}`,
      resource: userId,
    },
    runtimeContext,
  });
  
  return response;
}
