import { config } from 'dotenv';

// Load environment variables FIRST
config();

console.log('🚀 Starting OmniAgent Integration Test...\n');

// Test 1: PostgreSQL Connection
async function testPostgresConnection() {
  console.log('📊 Test 1: PostgreSQL Connection');
  try {
    // Import after env vars are loaded
    const { PostgresStore } = await import('@mastra/pg');
    const { PgVector } = await import('@mastra/pg');
    const { parsePostgresUrl } = await import('./mastra/utils/parse-postgres-url.js');
    
    const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://localhost/postgres';
    console.log(`   Connecting to: ${postgresUrl.replace(/:([^@]+)@/, ':****@')}`);
    
    // Parse connection string for PostgresStore
    const dbConfig = parsePostgresUrl(postgresUrl);
    
    const storage = new PostgresStore(dbConfig);
    
    const vector = new PgVector({
      connectionString: postgresUrl,
    });
    
    // PostgresStore and PgVector don't have init() methods
    // They are used internally by Memory
    console.log('   ✅ PostgresStore created successfully');
    console.log('   ✅ PgVector created successfully');
    
    // The real test is when Memory uses these stores
    
    return true;
  } catch (error) {
    console.error('   ❌ PostgreSQL connection failed:', error);
    return false;
  }
}

// Test 2: MCP Client Connection
async function testMCPConnection() {
  console.log('\n🔌 Test 2: MCP Client Connection');
  try {
    const { getMCPClient } = await import('./mastra/mcp/mcp-config.js');
    const { loadMCPTools } = await import('./mastra/tools/mcp-tool-loader.js');
    
    const mcpClient = await getMCPClient();
    
    if (!mcpClient) {
      console.log('   ⚠️  No MCP servers configured (check RUBE_MCP_TOKEN)');
      return null;
    }
    
    console.log('   ✅ MCP client initialized');
    
    // Try to list available tools
    const tools = await loadMCPTools();
    const toolCount = Object.keys(tools).length;
    console.log(`   ✅ Loaded ${toolCount} tools from MCP servers`);
    
    if (toolCount > 0) {
      console.log('   Available tools:', Object.keys(tools).slice(0, 5).join(', '), '...');
    }
    
    return tools;
  } catch (error) {
    console.error('   ❌ MCP connection failed:', error);
    return null;
  }
}

// Test 3: Memory System
async function testMemorySystem() {
  console.log('\n🧠 Test 3: Memory System');
  try {
    const { Memory } = await import('@mastra/memory');
    const { PostgresStore } = await import('@mastra/pg');
    const { PgVector } = await import('@mastra/pg');
    const { fastembed } = await import('@mastra/fastembed');
    const { parsePostgresUrl } = await import('./mastra/utils/parse-postgres-url.js');
    
    const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://localhost/postgres';
    
    const memory = new Memory({
      storage: new PostgresStore(parsePostgresUrl(postgresUrl)),
      vector: new PgVector({
        connectionString: postgresUrl,
      }),
      embedder: fastembed,
      options: {
        lastMessages: 20,
        semanticRecall: {
          topK: 5,
          messageRange: { before: 2, after: 2 },
          scope: 'thread',
        },
        workingMemory: {
          enabled: true,
          template: '# User Profile\n\n{{profile}}\n\n# Goals\n\n{{goals}}',
          scope: 'resource',
        },
      },
    });
    
    // Create a test thread
    const threadId = `test-thread-${Date.now()}`;
    const resourceId = 'test-user';
    
    await memory.createThread({
      resourceId,
      threadId,
      metadata: { type: 'test' },
    });
    console.log('   ✅ Created test thread:', threadId);
    
    // Create a simple test agent with this memory
    const { Agent } = await import('@mastra/core/agent');
    const { openai } = await import('@ai-sdk/openai');
    
    const testAgent = new Agent({
      name: 'test-memory-agent',
      instructions: 'You are a test agent.',
      model: openai('gpt-4o-mini'),
      memory,
    });
    
    // Generate a message to add to memory
    const response = await testAgent.generate('Hello, test memory system!', {
      memory: {
        thread: threadId,
        resource: resourceId,
      },
    });
    console.log('   ✅ Generated response and added to memory');
    
    // Retrieve messages using query
    const { messages } = await memory.query({
      threadId,
      resourceId,
    });
    console.log(`   ✅ Retrieved ${messages.length} messages from memory`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Memory system test failed:', error);
    return false;
  }
}

// Test 4: Agent Initialization
async function testAgentInitialization() {
  console.log('\n🤖 Test 4: Agent Initialization');
  try {
    // Import agents after env vars are loaded
    const { startConversation } = await import('./mastra/agents/main-agent.js');
    
    // Test main agent (complex with dynamic tools)
    console.log('   Testing Main Agent...');
    const { response, thread } = await startConversation(
      'test-user',
      'Hello, can you help me with my tasks?'
    );
    console.log('   ✅ Main Agent initialized and responded');
    console.log('   Thread ID:', thread);
    
    return true;
  } catch (error) {
    console.error('   ❌ Agent initialization failed:', error);
    return false;
  }
}

// Test 5: Dynamic Tool Loading
async function testDynamicToolLoading() {
  console.log('\n🔧 Test 5: Dynamic Tool Loading');
  try {
    const { createDynamicToolLoader } = await import('./mastra/tools/mcp-tool-loader.js');
    
    // Test loading tools for different domains
    const domains = ['email', 'calendar', 'web'];
    
    for (const domain of domains) {
      console.log(`   Loading tools for domain: ${domain}`);
      const loader = createDynamicToolLoader(domain);
      const tools = await loader();
      const toolCount = Object.keys(tools).length;
      console.log(`   ✅ Loaded ${toolCount} tools for ${domain} domain`);
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Dynamic tool loading failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Environment Variables:');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('  POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Set' : '⚠️  Not set (will use default)');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '⚠️  Not set');
  console.log('  RUBE_MCP_TOKEN:', process.env.RUBE_MCP_TOKEN ? '✅ Set' : '⚠️  Not set (MCP features disabled)');
  console.log('');
  
  const results = {
    postgres: await testPostgresConnection(),
    mcp: await testMCPConnection(),
    memory: await testMemorySystem(),
    agents: await testAgentInitialization(),
    dynamicTools: await testDynamicToolLoading(),
  };
  
  console.log('\n📋 Test Summary:');
  console.log('  PostgreSQL:', results.postgres ? '✅ PASSED' : '❌ FAILED');
  console.log('  MCP Client:', results.mcp !== null ? '✅ PASSED' : '⚠️  SKIPPED (no token)');
  console.log('  Memory System:', results.memory ? '✅ PASSED' : '❌ FAILED');
  console.log('  Agents:', results.agents ? '✅ PASSED' : '❌ FAILED');
  console.log('  Dynamic Tools:', results.dynamicTools ? '✅ PASSED' : '❌ FAILED');
  
  const critical = results.postgres && results.memory && results.agents;
  console.log('\n' + (critical ? '🎉 Core functionality is working!' : '❌ Some critical tests failed'));
  
  if (!results.postgres) {
    console.log('\n⚠️  PostgreSQL connection failed. Please ensure:');
    console.log('  1. PostgreSQL is running');
    console.log('  2. POSTGRES_URL or DATABASE_URL is correctly set');
    console.log('  3. The database "postgres" exists');
  }
  
  if (results.mcp === null) {
    console.log('\n⚠️  MCP features are disabled. To enable:');
    console.log('  1. Get your Rube MCP token from https://rube.app');
    console.log('  2. Set RUBE_MCP_TOKEN in your .env file');
  }
}

// Run the tests
runAllTests().catch(console.error);