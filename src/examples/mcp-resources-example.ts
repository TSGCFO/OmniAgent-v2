import { config } from 'dotenv';
config();

import { 
  getMCPResources, 
  getMCPResourceTemplates,
  readMCPResource,
  subscribeMCPResource,
  unsubscribeMCPResource,
  onMCPResourceUpdated,
  onMCPResourceListChanged,
  disconnectMCP
} from '../mastra/mcp/mcp-config.js';

async function demonstrateMCPResources() {
  console.log('🔍 MCP Resources Example\n');
  
  try {
    // 1. List all available resources from all servers
    console.log('1. Listing all available resources...');
    const resources = await getMCPResources();
    
    for (const [serverName, serverResources] of Object.entries(resources)) {
      console.log(`\n📦 Resources from ${serverName}:`);
      
      if (Array.isArray(serverResources) && serverResources.length > 0) {
        serverResources.forEach((resource: any) => {
          console.log(`  - ${resource.name || 'Unnamed'}`);
          console.log(`    URI: ${resource.uri}`);
          console.log(`    MIME Type: ${resource.mimeType || 'unknown'}`);
          if (resource.description) {
            console.log(`    Description: ${resource.description}`);
          }
        });
      } else {
        console.log('  No resources available');
      }
    }
    
    // 2. Get resource templates (for dynamic resources)
    console.log('\n2. Listing resource templates...');
    const templates = await getMCPResourceTemplates();
    
    for (const [serverName, serverTemplates] of Object.entries(templates)) {
      if (Array.isArray(serverTemplates) && serverTemplates.length > 0) {
        console.log(`\n🔧 Templates from ${serverName}:`);
        serverTemplates.forEach((template: any) => {
          console.log(`  - ${template.name || 'Unnamed'}`);
          console.log(`    URI Template: ${template.uriTemplate}`);
          if (template.description) {
            console.log(`    Description: ${template.description}`);
          }
        });
      }
    }
    
    // 3. Read a specific resource (example)
    // Note: You'll need to replace these with actual server and URI from your setup
    const exampleServerName = 'filesystem'; // or 'github', 'rube', etc.
    const exampleUri = 'file:///README.md'; // Replace with actual URI
    
    // Check if the server has resources before trying to read
    if (resources[exampleServerName]?.length > 0) {
      console.log(`\n3. Reading resource from ${exampleServerName}...`);
      
      try {
        const content = await readMCPResource(exampleServerName, exampleUri);
        console.log('Resource content:', content.contents?.[0]?.text?.substring(0, 200) + '...');
      } catch (error) {
        console.log(`Could not read ${exampleUri} - it may not exist`);
      }
    }
    
    // 4. Subscribe to resource updates
    console.log('\n4. Setting up resource subscriptions...');
    
    // Set up update handler
    await onMCPResourceUpdated(exampleServerName, (params) => {
      console.log(`📢 Resource updated: ${params.uri}`);
    });
    
    // Set up list change handler
    await onMCPResourceListChanged(exampleServerName, () => {
      console.log('📢 Resource list changed!');
    });
    
    // Subscribe to a specific resource
    if (resources[exampleServerName]?.length > 0) {
      try {
        await subscribeMCPResource(exampleServerName, exampleUri);
        console.log(`Subscribed to updates for ${exampleUri}`);
        
        // Simulate some waiting time
        console.log('Waiting for potential updates (5 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Unsubscribe
        await unsubscribeMCPResource(exampleServerName, exampleUri);
        console.log(`Unsubscribed from ${exampleUri}`);
      } catch (error) {
        console.log('Subscription not supported or resource not found');
      }
    }
    
  } catch (error) {
    console.error('Error demonstrating MCP resources:', error);
  } finally {
    // Clean up
    await disconnectMCP();
    console.log('\n✅ MCP client disconnected');
  }
}

// Example of using resources in a practical scenario
async function practicalExample() {
  console.log('\n📚 Practical Example: Reading documentation files\n');
  
  try {
    const resources = await getMCPResources();
    
    // Find all markdown files across servers
    const markdownResources: Array<{ server: string; resource: any }> = [];
    
    for (const [serverName, serverResources] of Object.entries(resources)) {
      if (Array.isArray(serverResources)) {
        serverResources.forEach((resource: any) => {
          if (resource.mimeType === 'text/markdown' || 
              resource.uri?.endsWith('.md') ||
              resource.name?.endsWith('.md')) {
            markdownResources.push({ server: serverName, resource });
          }
        });
      }
    }
    
    console.log(`Found ${markdownResources.length} markdown resources:`);
    
    // Read first few markdown files
    for (const { server, resource } of markdownResources.slice(0, 3)) {
      console.log(`\n📄 Reading ${resource.name} from ${server}...`);
      
      try {
        const content = await readMCPResource(server, resource.uri);
        const text = content.contents?.[0]?.text;
        
        if (text) {
          // Extract title (first # heading)
          const titleMatch = text.match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1] : 'No title';
          
          console.log(`  Title: ${title}`);
          console.log(`  Preview: ${text.substring(0, 150).replace(/\n/g, ' ')}...`);
        }
      } catch (error) {
        console.log(`  Error reading resource: ${error}`);
      }
    }
    
  } catch (error) {
    console.error('Error in practical example:', error);
  } finally {
    await disconnectMCP();
  }
}

// Run the examples
async function main() {
  // Basic demonstration
  await demonstrateMCPResources();
  
  // Practical example
  await practicalExample();
}

main().catch(console.error);
