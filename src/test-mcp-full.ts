import { config } from 'dotenv';
config();

import { 
  getMCPClient,
  getMCPTools,
  getMCPResources,
  getMCPPrompts,
  readMCPResource,
  getMCPPrompt,
  disconnectMCP
} from './mastra/mcp/mcp-config.js';
import { mainAgent } from './mastra/agents/main-agent.js';

async function testMCPFullImplementation() {
  console.log('🚀 Testing Full MCP Implementation\n');
  
  try {
    // 1. Test MCP Client connection
    console.log('1️⃣ Testing MCP Client Connection...');
    const client = await getMCPClient();
    if (client) {
      console.log('✅ MCP Client connected successfully\n');
    } else {
      console.log('❌ No MCP servers configured\n');
      return;
    }
    
    // 2. Test MCP Tools
    console.log('2️⃣ Testing MCP Tools...');
    const tools = await getMCPTools();
    const toolCount = Object.keys(tools).length;
    console.log(`✅ Found ${toolCount} MCP tools`);
    if (toolCount > 0) {
      console.log('   Sample tools:', Object.keys(tools).slice(0, 5).join(', '));
    }
    console.log();
    
    // 3. Test MCP Resources
    console.log('3️⃣ Testing MCP Resources...');
    const resources = await getMCPResources();
    let totalResources = 0;
    
    for (const [server, serverResources] of Object.entries(resources)) {
      if (Array.isArray(serverResources)) {
        console.log(`   📦 ${server}: ${serverResources.length} resources`);
        totalResources += serverResources.length;
        
        // Try to read first resource
        if (serverResources.length > 0) {
          const firstResource = serverResources[0];
          console.log(`      First resource: ${firstResource.name || firstResource.uri}`);
        }
      }
    }
    console.log(`✅ Total resources across all servers: ${totalResources}\n`);
    
    // 4. Test MCP Prompts
    console.log('4️⃣ Testing MCP Prompts...');
    const prompts = await getMCPPrompts();
    let totalPrompts = 0;
    
    for (const [server, serverPrompts] of Object.entries(prompts)) {
      if (Array.isArray(serverPrompts)) {
        console.log(`   💡 ${server}: ${serverPrompts.length} prompts`);
        totalPrompts += serverPrompts.length;
        
        // Show first prompt
        if (serverPrompts.length > 0) {
          const firstPrompt = serverPrompts[0];
          console.log(`      First prompt: ${firstPrompt.name}`);
          if (firstPrompt.description) {
            console.log(`      Description: ${firstPrompt.description}`);
          }
        }
      }
    }
    console.log(`✅ Total prompts across all servers: ${totalPrompts}\n`);
    
    // 5. Test Main Agent with MCP capabilities
    console.log('5️⃣ Testing Main Agent with MCP Tools...');
    
    // Test resource listing through agent
    console.log('\n📚 Testing resource access through agent...');
    const resourceResponse = await mainAgent.generate(
      'List all available MCP resources and tell me what types of resources are available',
      {
        memory: {
          thread: `test-mcp-${Date.now()}`,
          resource: 'test-user'
        }
      }
    );
    console.log('Agent response:', resourceResponse.text.substring(0, 300) + '...\n');
    
    // Test prompt listing through agent
    console.log('💡 Testing prompt access through agent...');
    const promptResponse = await mainAgent.generate(
      'What MCP prompts are available and what are they used for?',
      {
        memory: {
          thread: `test-mcp-${Date.now()}`,
          resource: 'test-user'
        }
      }
    );
    console.log('Agent response:', promptResponse.text.substring(0, 300) + '...\n');
    
    // 6. Demonstration of advanced capabilities
    console.log('6️⃣ Advanced MCP Capabilities Demo...\n');
    
    // If we have resources, demonstrate reading
    const hasResources = Object.values(resources).some(r => Array.isArray(r) && r.length > 0);
    if (hasResources) {
      console.log('📄 Demonstrating resource reading...');
      const readResponse = await mainAgent.generate(
        'Find and read any markdown documentation files available in the MCP resources',
        {
          memory: {
            thread: `test-mcp-${Date.now()}`,
            resource: 'test-user'
          }
        }
      );
      console.log('Agent found:', readResponse.text.substring(0, 200) + '...\n');
    }
    
    // If we have prompts, demonstrate using them
    const hasPrompts = Object.values(prompts).some(p => Array.isArray(p) && p.length > 0);
    if (hasPrompts) {
      console.log('🎯 Demonstrating prompt usage...');
      const promptUseResponse = await mainAgent.generate(
        'Find a general-purpose or help prompt and use it to explain how MCP works',
        {
          memory: {
            thread: `test-mcp-${Date.now()}`,
            resource: 'test-user'
          }
        }
      );
      console.log('Agent used prompt:', promptUseResponse.text.substring(0, 200) + '...\n');
    }
    
    console.log('✅ All MCP tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during MCP testing:', error);
  } finally {
    await disconnectMCP();
    console.log('\n🔌 MCP client disconnected');
  }
}

// Run the test
console.log('='.repeat(60));
console.log('MCP Full Implementation Test');
console.log('='.repeat(60));
console.log();

testMCPFullImplementation().catch(console.error);
