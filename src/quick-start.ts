import 'dotenv/config';
import { agentCoordinator } from './mastra/services/agent-coordinator.js';
import { verifyMemoryConfiguration } from './mastra/memory/memory-config.js';

console.log(`
🚀 Welcome to OmniAgent - Your Unified AI Assistant!

This is a quick start demo showing the capabilities of the multi-agent system.
`);

async function quickStart() {
  // Check configuration
  console.log('🔍 Checking system configuration...');
  const memoryOk = await verifyMemoryConfiguration();
  
  if (!memoryOk) {
    console.error(`
❌ System not properly configured!

Please ensure you have:
1. Created a .env file with your OPENAI_API_KEY
2. Set up the required environment variables

Run: cp .env.example .env
Then edit .env with your API key.
`);
    return;
  }
  
  console.log('✅ System configured successfully!\n');
  
  // Demo user
  const userId = 'quickstart-user-' + Date.now();
  
  console.log('📝 Let me show you what I can do:\n');
  
  // Demonstrate capabilities
  const demos = [
    {
      title: '1️⃣ Email Management',
      message: 'Find any urgent emails from this week and summarize them',
    },
    {
      title: '2️⃣ Calendar Scheduling',
      message: 'Schedule a team meeting next Tuesday at 3 PM',
    },
    {
      title: '3️⃣ Information Research',
      message: 'What are the latest trends in AI for business?',
    },
    {
      title: '4️⃣ Complex Coordination',
      message: 'Research productivity tips, draft an email about them, and schedule a workshop',
    },
  ];
  
  for (const demo of demos) {
    console.log(`\n${demo.title}`);
    console.log(`You: "${demo.message}"`);
    console.log('\n⏳ Processing...\n');
    
    const result = await agentCoordinator.processRequest({
      userId,
      message: demo.message,
    });
    
    console.log(`🤖 OmniAgent: ${result.response}`);
    console.log(`   (Used agents: ${result.agentsUsed.join(', ')})`);
  }
  
  console.log(`
  
✨ That's just a glimpse of what OmniAgent can do!

🎯 Key Features:
- Single interface for all digital tasks
- Remembers your preferences and context
- Coordinates multiple specialized agents
- Learns from every interaction

🚀 To start using OmniAgent:

1. Interactive chat mode:
   npm run test:example -- --interactive

2. Run more examples:
   npm run test:example

3. Start the development server:
   npm run dev

Happy automating! 🎉
`);
}

quickStart().catch(console.error);
