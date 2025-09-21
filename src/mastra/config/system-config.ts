import { z } from 'zod';

// System configuration schema
export const SystemConfigSchema = z.object({
  // Memory settings
  memory: z.object({
    workingMemoryScope: z.enum(['thread', 'resource']).default('resource'),
    semanticRecallTopK: z.number().min(1).max(20).default(5),
    semanticRecallMessageRange: z.number().min(0).max(10).default(2),
    lastMessagesCount: z.number().min(5).max(100).default(20),
    enableSemanticRecall: z.boolean().default(true),
    enableWorkingMemory: z.boolean().default(true),
  }),
  
  // Agent settings
  agents: z.object({
    mainModel: z.string().default('gpt-4o'),
    subAgentModel: z.string().default('gpt-4o-mini'),
    temperature: z.number().min(0).max(2).default(0.7),
    maxSteps: z.number().min(1).max(10).default(5),
  }),
  
  // Feature flags
  features: z.object({
    enableProactiveSuggestions: z.boolean().default(false),
    enableMultiModal: z.boolean().default(false),
    enableVoice: z.boolean().default(false),
  }),
});

export type SystemConfig = z.infer<typeof SystemConfigSchema>;

// Default configuration
export const defaultConfig: SystemConfig = {
  memory: {
    workingMemoryScope: 'resource',
    semanticRecallTopK: 5,
    semanticRecallMessageRange: 2,
    lastMessagesCount: 20,
    enableSemanticRecall: true,
    enableWorkingMemory: true,
  },
  agents: {
    mainModel: 'gpt-4o',
    subAgentModel: 'gpt-4o-mini',
    temperature: 0.7,
    maxSteps: 5,
  },
  features: {
    enableProactiveSuggestions: false,
    enableMultiModal: false,
    enableVoice: false,
  },
};

// Get configuration from environment
export function getSystemConfig(): SystemConfig {
  return SystemConfigSchema.parse({
    memory: {
      workingMemoryScope: process.env.MEMORY_WORKING_SCOPE || defaultConfig.memory.workingMemoryScope,
      semanticRecallTopK: process.env.MEMORY_SEMANTIC_RECALL_TOPK 
        ? parseInt(process.env.MEMORY_SEMANTIC_RECALL_TOPK) 
        : defaultConfig.memory.semanticRecallTopK,
      semanticRecallMessageRange: process.env.MEMORY_SEMANTIC_RECALL_MESSAGE_RANGE
        ? parseInt(process.env.MEMORY_SEMANTIC_RECALL_MESSAGE_RANGE)
        : defaultConfig.memory.semanticRecallMessageRange,
      lastMessagesCount: process.env.MEMORY_LAST_MESSAGES_COUNT
        ? parseInt(process.env.MEMORY_LAST_MESSAGES_COUNT)
        : defaultConfig.memory.lastMessagesCount,
      enableSemanticRecall: process.env.ENABLE_SEMANTIC_RECALL === 'true',
      enableWorkingMemory: process.env.ENABLE_WORKING_MEMORY === 'true',
    },
    agents: defaultConfig.agents,
    features: {
      enableProactiveSuggestions: process.env.ENABLE_PROACTIVE_SUGGESTIONS === 'true',
      enableMultiModal: false,
      enableVoice: false,
    },
  });
}
