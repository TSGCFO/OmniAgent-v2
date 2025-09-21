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

async function testMCPSimple() {
  console.log('🚀 Testing MCP Resources and Prompts\n');
  
  try {
    // 1. Test MCP Client connection
    console.log('1️⃣ Testing MCP Client Connection...');
    const client = await getMCPClient();
    if (client) {
      console.log('✅ MCP Client connected successfully\n');
    } else {
      console.log('❌ No MCP servers configured');
      console.log('   Make sure to set RUBE_MCP_TOKEN or other MCP server configs\n');
      return;
    }
    
    // 2. Test MCP Tools
    console.log('2️⃣ Testing MCP Tools...');
    const tools = await getMCPTools();
    const toolCount = Object.keys(tools).length;
    console.log(`✅ Found ${toolCount} MCP tools`);
    if (toolCount > 0) {
      const toolNames = Object.keys(tools);
      console.log('   First 10 tools:', toolNames.slice(0, 10).join(', '));
      if (toolNames.length > 10) {
        console.log(`   ... and ${toolNames.length - 10} more`);
      }
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
        
        // Show first few resources
        if (serverResources.length > 0) {
          console.log('      Sample resources:');
          serverResources.slice(0, 3).forEach(resource => {
            console.log(`        - ${resource.name || resource.uri}`);
            if (resource.mimeType) {
              console.log(`          Type: ${resource.mimeType}`);
            }
          });
          if (serverResources.length > 3) {
            console.log(`        ... and ${serverResources.length - 3} more`);
          }
        }
      }
    }
    console.log(`✅ Total resources across all servers: ${totalResources}\n`);
    
    // 4. Test reading a resource (if any available)
    if (totalResources > 0) {
      console.log('4️⃣ Testing Resource Reading...');
      // Find first readable resource
      let readSuccess = false;
      
      for (const [server, serverResources] of Object.entries(resources)) {
        if (!Array.isArray(serverResources) || readSuccess) continue;
        
        for (const resource of serverResources) {
          // Skip binary resources
          if (resource.mimeType?.startsWith('image/') || 
              resource.mimeType?.startsWith('video/') ||
              resource.mimeType?.startsWith('audio/')) {
            continue;
          }
          
          try {
            console.log(`   Reading "${resource.name || resource.uri}" from ${server}...`);
            const content = await readMCPResource(server, resource.uri);
            const text = content.contents?.[0]?.text || '';
            
            if (text) {
              console.log(`   ✅ Successfully read resource (${text.length} characters)`);
              console.log(`   Preview: ${text.substring(0, 100)}...`);
              readSuccess = true;
              break;
            }
          } catch (error) {
            console.log(`   ⚠️  Could not read: ${error}`);
          }
        }
      }
      
      if (!readSuccess) {
        console.log('   ℹ️  No readable text resources found');
      }
      console.log();
    }
    
    // 5. Test MCP Prompts
    console.log('5️⃣ Testing MCP Prompts...');
    const prompts = await getMCPPrompts();
    let totalPrompts = 0;
    
    for (const [server, serverPrompts] of Object.entries(prompts)) {
      if (Array.isArray(serverPrompts)) {
        console.log(`   💡 ${server}: ${serverPrompts.length} prompts`);
        totalPrompts += serverPrompts.length;
        
        // Show first few prompts
        if (serverPrompts.length > 0) {
          console.log('      Sample prompts:');
          serverPrompts.slice(0, 3).forEach(prompt => {
            console.log(`        - ${prompt.name}`);
            if (prompt.description) {
              console.log(`          ${prompt.description.substring(0, 60)}...`);
            }
            if (prompt.version) {
              console.log(`          Version: ${prompt.version}`);
            }
          });
          if (serverPrompts.length > 3) {
            console.log(`        ... and ${serverPrompts.length - 3} more`);
          }
        }
      }
    }
    console.log(`✅ Total prompts across all servers: ${totalPrompts}\n`);
    
    // 6. Test getting a prompt (if any available)
    if (totalPrompts > 0) {
      console.log('6️⃣ Testing Prompt Retrieval...');
      let promptSuccess = false;
      
      for (const [server, serverPrompts] of Object.entries(prompts)) {
        if (!Array.isArray(serverPrompts) || promptSuccess) continue;
        
        if (serverPrompts.length > 0) {
          const firstPrompt = serverPrompts[0];
          
          try {
            console.log(`   Getting prompt "${firstPrompt.name}" from ${server}...`);
            const promptData = await getMCPPrompt({
              serverName: server,
              name: firstPrompt.name,
              args: {},
              version: firstPrompt.version
            });
            
            console.log(`   ✅ Successfully retrieved prompt`);
            console.log(`   Messages: ${promptData.messages.length}`);
            promptData.messages.forEach((msg, i) => {
              const content = typeof msg.content === 'string' 
                ? msg.content 
                : msg.content?.text || JSON.stringify(msg.content);
              console.log(`     ${i + 1}. ${msg.role}: ${content.substring(0, 50)}...`);
            });
            
            promptSuccess = true;
            break;
          } catch (error) {
            console.log(`   ⚠️  Could not get prompt: ${error}`);
          }
        }
      }
      
      if (!promptSuccess) {
        console.log('   ℹ️  Could not retrieve any prompts');
      }
    }
    
    console.log('\n✅ MCP Resources and Prompts test completed!');
    
  } catch (error) {
    console.error('\n❌ Error during MCP testing:', error);
  } finally {
    await disconnectMCP();
    console.log('\n🔌 MCP client disconnected');
  }
}

// Run the test
console.log('='.repeat(60));
console.log('MCP Resources and Prompts Test');
console.log('='.repeat(60));
console.log();

testMCPSimple().catch(console.error);
