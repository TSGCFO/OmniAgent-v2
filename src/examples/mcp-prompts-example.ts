import { config } from 'dotenv';
config();

import { 
  getMCPPrompts,
  getMCPPrompt,
  onMCPPromptListChanged,
  disconnectMCP
} from '../mastra/mcp/mcp-config.js';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

async function demonstrateMCPPrompts() {
  console.log('💡 MCP Prompts Example\n');
  
  try {
    // 1. List all available prompts from all servers
    console.log('1. Listing all available prompts...');
    const prompts = await getMCPPrompts();
    
    const allPrompts: Array<{ server: string; prompt: any }> = [];
    
    for (const [serverName, serverPrompts] of Object.entries(prompts)) {
      console.log(`\n📝 Prompts from ${serverName}:`);
      
      if (Array.isArray(serverPrompts) && serverPrompts.length > 0) {
        serverPrompts.forEach((prompt: any) => {
          console.log(`  - ${prompt.name}`);
          console.log(`    Description: ${prompt.description || 'No description'}`);
          if (prompt.version) {
            console.log(`    Version: ${prompt.version}`);
          }
          if (prompt.arguments) {
            console.log(`    Arguments:`, prompt.arguments);
          }
          
          allPrompts.push({ server: serverName, prompt });
        });
      } else {
        console.log('  No prompts available');
      }
    }
    
    // 2. Get a specific prompt with its messages
    if (allPrompts.length > 0) {
      const firstPrompt = allPrompts[0];
      console.log(`\n2. Getting prompt details for "${firstPrompt.prompt.name}" from ${firstPrompt.server}...`);
      
      try {
        const promptDetails = await getMCPPrompt({
          serverName: firstPrompt.server,
          name: firstPrompt.prompt.name,
          args: {}, // Add any required arguments here
          version: firstPrompt.prompt.version
        });
        
        console.log('\nPrompt details:');
        console.log('- Name:', promptDetails.prompt.name);
        console.log('- Description:', promptDetails.prompt.description);
        console.log('- Messages:');
        
        promptDetails.messages.forEach((msg: any, index: number) => {
          console.log(`  ${index + 1}. Role: ${msg.role}`);
          if (msg.content) {
            if (typeof msg.content === 'string') {
              console.log(`     Content: ${msg.content.substring(0, 100)}...`);
            } else if (msg.content.type === 'text') {
              console.log(`     Content: ${msg.content.text.substring(0, 100)}...`);
            }
          }
        });
      } catch (error) {
        console.log('Error getting prompt details:', error);
      }
    }
    
    // 3. Set up prompt list change handlers
    console.log('\n3. Setting up prompt list change handlers...');
    
    for (const serverName of Object.keys(prompts)) {
      await onMCPPromptListChanged(serverName, () => {
        console.log(`📢 Prompt list changed for ${serverName}!`);
      });
      console.log(`Listening for prompt changes on ${serverName}`);
    }
    
  } catch (error) {
    console.error('Error demonstrating MCP prompts:', error);
  }
}

// Example of using prompts with an agent
async function promptWithAgentExample() {
  console.log('\n🤖 Using MCP Prompts with an Agent\n');
  
  try {
    const prompts = await getMCPPrompts();
    
    // Find a suitable prompt
    let targetPrompt = null;
    let targetServer = null;
    
    for (const [serverName, serverPrompts] of Object.entries(prompts)) {
      if (Array.isArray(serverPrompts) && serverPrompts.length > 0) {
        // Look for a general-purpose prompt
        const prompt = serverPrompts.find((p: any) => 
          p.name.toLowerCase().includes('general') ||
          p.name.toLowerCase().includes('help') ||
          p.name.toLowerCase().includes('assist')
        ) || serverPrompts[0];
        
        if (prompt) {
          targetPrompt = prompt;
          targetServer = serverName;
          break;
        }
      }
    }
    
    if (targetPrompt && targetServer) {
      console.log(`Using prompt "${targetPrompt.name}" from ${targetServer}`);
      
      // Get the prompt messages
      const promptData = await getMCPPrompt({
        serverName: targetServer,
        name: targetPrompt.name,
        args: { 
          topic: 'MCP integration',
          context: 'Building an AI assistant with Mastra'
        }
      });
      
      // Create an agent that uses the prompt
      const agent = new Agent({
        name: 'Prompt-Enhanced Agent',
        instructions: 'You are an AI assistant that uses MCP prompts to provide better responses.',
        model: openai('gpt-4o-mini'),
      });
      
      // Combine prompt messages with user query
      const messages = [
        ...promptData.messages,
        { role: 'user', content: 'How can I best utilize MCP prompts in my application?' }
      ];
      
      console.log('\nGenerating response with prompt-enhanced context...');
      const response = await agent.generate(messages);
      
      console.log('\nAgent response:');
      console.log(response.text.substring(0, 500) + '...');
      
    } else {
      console.log('No suitable prompts found for demonstration');
    }
    
  } catch (error) {
    console.error('Error in agent example:', error);
  }
}

// Example of creating a prompt manager
class MCPPromptManager {
  private promptCache: Map<string, any> = new Map();
  
  async refreshPrompts() {
    console.log('Refreshing prompt cache...');
    const prompts = await getMCPPrompts();
    
    this.promptCache.clear();
    
    for (const [serverName, serverPrompts] of Object.entries(prompts)) {
      if (Array.isArray(serverPrompts)) {
        serverPrompts.forEach((prompt: any) => {
          const key = `${serverName}:${prompt.name}:${prompt.version || 'default'}`;
          this.promptCache.set(key, { server: serverName, prompt });
        });
      }
    }
    
    console.log(`Cached ${this.promptCache.size} prompts`);
  }
  
  async getPromptByCategory(category: string): Promise<any[]> {
    const results = [];
    
    for (const [key, value] of this.promptCache.entries()) {
      if (value.prompt.description?.toLowerCase().includes(category.toLowerCase()) ||
          value.prompt.name.toLowerCase().includes(category.toLowerCase())) {
        results.push(value);
      }
    }
    
    return results;
  }
  
  async executePrompt(serverName: string, promptName: string, args: Record<string, any> = {}) {
    const promptData = await getMCPPrompt({
      serverName,
      name: promptName,
      args
    });
    
    return promptData;
  }
}

// Demonstrate the prompt manager
async function promptManagerExample() {
  console.log('\n📊 Prompt Manager Example\n');
  
  const manager = new MCPPromptManager();
  
  try {
    // Refresh the cache
    await manager.refreshPrompts();
    
    // Find prompts by category
    const analysisPrompts = await manager.getPromptByCategory('analysis');
    console.log(`\nFound ${analysisPrompts.length} analysis-related prompts`);
    
    analysisPrompts.forEach(({ server, prompt }) => {
      console.log(`- ${prompt.name} (${server})`);
    });
    
    // Execute a prompt if we found one
    if (analysisPrompts.length > 0) {
      const { server, prompt } = analysisPrompts[0];
      console.log(`\nExecuting prompt "${prompt.name}"...`);
      
      const result = await manager.executePrompt(server, prompt.name, {
        input: 'Sample data for analysis'
      });
      
      console.log('Prompt executed successfully');
      console.log(`Generated ${result.messages.length} messages`);
    }
    
  } catch (error) {
    console.error('Error in prompt manager example:', error);
  }
}

// Run the examples
async function main() {
  // Basic demonstration
  await demonstrateMCPPrompts();
  
  // Using prompts with agents
  await promptWithAgentExample();
  
  // Prompt manager example
  await promptManagerExample();
  
  // Clean up
  await disconnectMCP();
  console.log('\n✅ MCP client disconnected');
}

main().catch(console.error);
