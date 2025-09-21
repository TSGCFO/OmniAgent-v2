import { config } from 'dotenv';
config();

import { mainAgent } from './mastra/agents/main-agent.js';
import { disconnectMCP } from './mastra/mcp/mcp-config.js';

async function testIntelligentMCP() {
  console.log('🧠 Testing Intelligent MCP Usage\n');
  console.log('This test demonstrates how the agent automatically finds and uses');
  console.log('relevant MCP resources and prompts without explicit instructions.\n');
  
  const testQueries = [
    {
      query: "How can I get started with using this system?",
      expected: "Should find 'get-started' prompt"
    },
    {
      query: "Can you help me analyze my Slack channels?",
      expected: "Should find Slack-related prompts"
    },
    {
      query: "What integrations are available?",
      expected: "Should list available tools and capabilities"
    },
    {
      query: "I need to create a comprehensive digest of yesterday's activities",
      expected: "Should find digest-related prompts"
    }
  ];
  
  for (const test of testQueries) {
    console.log('='.repeat(60));
    console.log(`\n🔍 Query: "${test.query}"`);
    console.log(`📋 Expected: ${test.expected}\n`);
    
    try {
      const response = await mainAgent.generate(test.query, {
        memory: {
          thread: `test-intelligent-${Date.now()}`,
          resource: 'test-user'
        }
      });
      
      console.log('🤖 Agent Response:');
      console.log(response.text.substring(0, 500) + '...\n');
      
      // Check if the agent used MCP tools
      const toolCalls = response.toolCalls || [];
      const mcpToolsUsed = toolCalls.filter(call => 
        call.toolName?.includes('MCP') || 
        call.toolName?.includes('intelligent')
      );
      
      if (mcpToolsUsed.length > 0) {
        console.log('✅ MCP Tools Used:');
        mcpToolsUsed.forEach(call => {
          console.log(`   - ${call.toolName}`);
        });
      } else {
        console.log('⚠️  No MCP tools were used');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
    
    console.log();
  }
  
  // Test with a more complex scenario
  console.log('='.repeat(60));
  console.log('\n🚀 Complex Scenario Test:');
  console.log('Query: "I want to set up automated Slack summaries for my team. Can you guide me through the process and show me what\'s possible?"\n');
  
  try {
    const complexResponse = await mainAgent.generate(
      "I want to set up automated Slack summaries for my team. Can you guide me through the process and show me what's possible?",
      {
        memory: {
          thread: `test-complex-${Date.now()}`,
          resource: 'test-user'
        }
      }
    );
    
    console.log('🤖 Agent Response:');
    console.log(complexResponse.text);
    
  } catch (error) {
    console.error('❌ Error in complex scenario:', error);
  }
  
  await disconnectMCP();
  console.log('\n✅ Test completed');
}

// Run the test
console.log('Intelligent MCP Usage Test');
console.log('='.repeat(60));

testIntelligentMCP().catch(console.error);
