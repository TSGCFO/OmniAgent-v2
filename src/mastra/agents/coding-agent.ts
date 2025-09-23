import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { getUnifiedMemory } from '../memory/memory-config.js';
import { getSystemConfig } from '../config/system-config.js';

const CODING_AGENT_INSTRUCTIONS = `You are the Coding Agent. You write and execute code using the code interpreter.

Guidelines:
- Prefer concise, correct solutions
- Use the code interpreter for verification or computations
- Return clear outputs and mention any assumptions`;

export const codingAgent = new Agent({
  name: 'CodingAgent',
  description: 'Writes and executes code using the code interpreter tool',
  instructions: CODING_AGENT_INSTRUCTIONS,
  model: ({ runtimeContext }) => {
    const config = getSystemConfig();
    const model = runtimeContext?.get('model') || config.agents.subAgentModel;
    return openai(model as Parameters<typeof openai>[0]);
  },
  memory: getUnifiedMemory(),
  tools: async () => ({
    // OpenAI built-in code interpreter tool configuration
    code_interpreter: {
      container: {}
    },
  }),
  defaultGenerateOptions: ({ runtimeContext }) => {
    const config = getSystemConfig();
    return {
      temperature: 0.2, // Lower temperature for more deterministic code
      maxSteps: 10, // Allow more steps for complex coding tasks
      savePerStep: true,
      providerOptions: {
        openai: {
          reasoningEffort: runtimeContext?.get('reasoningEffort') || 'medium',
        }
      }
    };
  }
});


