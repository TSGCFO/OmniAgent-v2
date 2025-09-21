import { config } from 'dotenv';
config();

import { mainAgent } from './mastra/agents/main-agent.js';
import { disconnectMCP } from './mastra/mcp/mcp-config.js';

async function testAgentIntelligence() {
  console.log('🧠 Testing Agent Intelligence with MCP\n');
  
  // Test 1: Simple getting started query
  console.log('Test 1: Getting Started Query');
  console.log('User: "How do I get started with this system?"');
  console.log('-'.repeat(50));
  
  try {
    const response1 = await mainAgent.generate(
      "How do I get started with this system?",
      {
        memory: {
          thread: `test-${Date.now()}`,
          resource: 'test-user'
        }
      }
    );
    
    console.log('\nAgent Response:');
    console.log(response1.text);
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test 2: Slack-specific query
  console.log('Test 2: Slack Integration Query');
  console.log('User: "Can you help me analyze my Slack channels?"');
  console.log('-'.repeat(50));
  
  try {
    const response2 = await mainAgent.generate(
      "Can you help me analyze my Slack channels?",
      {
        memory: {
          thread: `test-slack-${Date.now()}`,
          resource: 'test-user'
        }
      }
    );
    
    console.log('\nAgent Response:');
    console.log(response2.text);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await disconnectMCP();
  console.log('\n✅ Test completed');
}

// Run the test
testAgentIntelligence().catch(console.error);
