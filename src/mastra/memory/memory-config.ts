import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';
import { PgVector } from '@mastra/pg';
import { fastembed } from '@mastra/fastembed';
import { getSystemConfig } from '../config/system-config.js';
import { createUnifiedMemoryProcessors } from './memory-processors.js';
import { parsePostgresUrl } from '../utils/parse-postgres-url.js';

// Create a singleton memory instance for the unified agent system
let memoryInstance: Memory | null = null;

// Working memory template for the unified assistant
const UNIFIED_ASSISTANT_TEMPLATE = `# User Profile

## Personal Information
- **Name**: 
- **Location**: 
- **Timezone**: 
- **Primary Language**: 
- **Communication Style**: [Formal/Casual/Professional]

## Preferences
- **Email Management**: [Priority levels, filtering preferences]
- **Calendar Preferences**: [Meeting duration preferences, buffer times]
- **Project Management Style**: [Tools used, organization methods]
- **Work Hours**: 
- **Notification Preferences**: 

## Current Context
- **Active Projects**: 
  - [Project 1]: [Status/Notes]
  - [Project 2]: [Status/Notes]
- **Key Deadlines**: 
  - [Deadline 1]: [Date/Description]
  - [Deadline 2]: [Date/Description]
- **Important Contacts**: 
  - [Contact 1]: [Relationship/Context]
  - [Contact 2]: [Relationship/Context]

## Learned Patterns
- **Common Tasks**: [Frequently requested actions]
- **Communication Patterns**: [Email response patterns, meeting scheduling habits]
- **Tool Usage**: [Preferred applications and workflows]
- **Decision Patterns**: [How user makes choices]

## Session State
- **Last Task**: 
- **Pending Actions**: 
  - [Action 1]
  - [Action 2]
- **Context Switches**: [Recent topic changes]`;

export function createUnifiedMemory(): Memory {
  if (memoryInstance) {
    return memoryInstance;
  }

  const config = getSystemConfig();
  
  // Create storage instances
  const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://localhost/postgres';
  if (!postgresUrl) {
    console.warn('POSTGRES_URL or DATABASE_URL not set, using default: postgresql://localhost/postgres');
  }
  
  // Parse the connection string into components
  const dbConfig = parsePostgresUrl(postgresUrl);
  
  // Use individual parameters for PostgresStore (as shown in Mastra examples)
  const storage = new PostgresStore(dbConfig);
  
  // PgVector still uses connection string
  const vector = new PgVector({
    connectionString: postgresUrl,
  });

  // Create memory with comprehensive configuration
  memoryInstance = new Memory({
    storage,
    vector,
    embedder: fastembed,
    processors: createUnifiedMemoryProcessors(),
    options: {
      // Conversation history
      lastMessages: config.memory.lastMessagesCount,
      
      // Semantic recall configuration
      semanticRecall: config.memory.enableSemanticRecall ? {
        topK: config.memory.semanticRecallTopK,
        messageRange: config.memory.semanticRecallMessageRange,
        scope: config.memory.workingMemoryScope as 'thread' | 'resource',
      } : false,
      
      // Working memory configuration
      workingMemory: {
        enabled: config.memory.enableWorkingMemory,
        template: UNIFIED_ASSISTANT_TEMPLATE,
        scope: config.memory.workingMemoryScope as 'thread' | 'resource',
      },
      
      // Thread configuration
      threads: {
        generateTitle: true,
      },
    },
  });

  return memoryInstance;
}

// Export the unified memory instance getter
export function getUnifiedMemory(): Memory {
  if (!memoryInstance) {
    return createUnifiedMemory();
  }
  return memoryInstance;
}

// Memory utilities
export interface MemoryContext {
  thread: string;
  resource: string;
}

// Helper to create consistent memory context
export function createMemoryContext(userId: string, threadId?: string): MemoryContext {
  return {
    thread: threadId || `thread-${userId}-${Date.now()}`,
    resource: userId,
  };
}

// Helper to check if memory is properly configured
export async function verifyMemoryConfiguration(): Promise<boolean> {
  try {
    const memory = getUnifiedMemory();
    // Test basic operations
    const testThread = await memory.createThread({
      resourceId: 'test-resource',
      threadId: 'test-thread-' + Date.now(),
      title: 'Configuration Test',
    });
    
    if (testThread?.id) {
      console.log('✅ Memory system configured successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Memory configuration error:', error);
    return false;
  }
}
