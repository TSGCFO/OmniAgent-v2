import 'dotenv/config';
import { mastra } from './mastra/index.js';
import { startConversation } from './mastra/agents/main-agent.js';
import { verifyMemoryConfiguration } from './mastra/memory/memory-config.js';

async function testMainAgent() {
  console.log('🧪 Testing OmniAgent Main Orchestrator\n');
  
  // Verify memory is configured
  const memoryOk = await verifyMemoryConfiguration();
  if (!memoryOk) {
    console.error('❌ Memory system not properly configured');
    return;
  }
  
  const userId = 'test-user-' + Date.now();
  
  try {
    // Test 1: Basic greeting and memory
    console.log('Test 1: Basic interaction with memory');
    const test1 = await startConversation(
      userId,
      "Hello! My name is Sarah and I work in marketing. I prefer casual communication style."
    );
    console.log('Response:', test1.response);
    console.log('Thread ID:', test1.thread, '\n');
    
    // Test 2: Task planning
    console.log('Test 2: Task planning capability');
    const test2 = await startConversation(
      userId,
      "I need to prepare for a product launch next month. Can you help me plan?",
      test1.thread // Continue same thread
    );
    console.log('Response:', test2.response, '\n');
    
    // Test 3: Memory recall
    console.log('Test 3: Memory recall');
    const test3 = await startConversation(
      userId,
      "What's my name and what do I do?",
      test1.thread
    );
    console.log('Response:', test3.response, '\n');
    
    // Test 4: Complex multi-step task
    console.log('Test 4: Complex task delegation');
    const test4 = await startConversation(
      userId,
      "Search for the latest marketing trends in AI, draft an email about it, and schedule a meeting to discuss",
      test1.thread
    );
    console.log('Response:', test4.response, '\n');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Direct agent testing without the coordinator
async function testDirectAgentCalls() {
  console.log('\n🔧 Testing Direct Agent Calls\n');
  
  const mainAgent = mastra.getAgent('mainAgent');
  const emailAgent = mastra.getAgent('emailAgent');
  
  // Test direct main agent call
  console.log('Direct Main Agent Call:');
  const directResult = await mainAgent.generate('Help me organize my day', {
    memory: {
      thread: 'direct-test-thread',
      resource: 'direct-test-user',
    },
  });
  console.log('Response:', directResult.text);
  console.log('Tool calls:', directResult.toolCalls?.map(tc => tc.toolName) || 'None');
  
  // Test direct email agent call
  console.log('\nDirect Email Agent Call:');
  const emailResult = await emailAgent.generate('Find emails from John about the project', {
    memory: {
      thread: 'email-test-thread',
      resource: 'direct-test-user',
    },
  });
  console.log('Response:', emailResult.text);
}

// Main execution
async function main() {
  await testMainAgent();
  await testDirectAgentCalls();
}

main().catch(console.error);
