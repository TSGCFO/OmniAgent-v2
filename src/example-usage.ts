import 'dotenv/config';
import { agentCoordinator } from './mastra/services/agent-coordinator.js';
import { verifyMemoryConfiguration } from './mastra/memory/memory-config.js';

// Example scenarios demonstrating the unified AI assistant capabilities

async function runExamples() {
  console.log('🚀 OmniAgent Unified AI Assistant - Example Usage\n');
  
  // Verify system is properly configured
  const memoryOk = await verifyMemoryConfiguration();
  if (!memoryOk) {
    console.error('❌ Memory system not properly configured. Please check your environment.');
    return;
  }
  
  // Test user ID
  const userId = 'demo-user-123';
  
  // Example 1: Simple email task
  console.log('📧 Example 1: Email Management');
  console.log('User: "Check my emails for anything urgent"');
  
  const emailResult = await agentCoordinator.processRequest({
    userId,
    message: 'Check my emails for anything urgent and summarize them for me',
  });
  
  console.log(`Assistant: ${emailResult.response}`);
  console.log(`Execution time: ${emailResult.executionTime}ms`);
  console.log(`Agents used: ${emailResult.agentsUsed.join(', ')}\n`);
  
  // Example 2: Calendar scheduling
  console.log('📅 Example 2: Calendar Scheduling');
  console.log('User: "Schedule a meeting with the team next Tuesday at 2 PM"');
  
  const calendarResult = await agentCoordinator.processRequest({
    userId,
    message: 'Schedule a meeting with the team next Tuesday at 2 PM for 1 hour',
    context: { thread: emailResult.thread }, // Continue same conversation
  });
  
  console.log(`Assistant: ${calendarResult.response}`);
  console.log(`Agents used: ${calendarResult.agentsUsed.join(', ')}\n`);
  
  // Example 3: Complex multi-agent task
  console.log('🔄 Example 3: Complex Multi-Agent Task');
  console.log('User: "Find information about AI trends, draft an email summary, and schedule a presentation next week"');
  
  const complexResult = await agentCoordinator.processRequest({
    userId,
    message: 'Research the latest AI trends in 2025, draft an email summary for my team, and schedule a presentation meeting next week to discuss',
    context: { 
      thread: emailResult.thread,
      priority: 'high',
    },
  });
  
  console.log(`Assistant: ${complexResult.response}`);
  console.log(`Task complexity: ${complexResult.metadata?.analysis.complexity}`);
  console.log(`Agents used: ${complexResult.agentsUsed.join(', ')}`);
  console.log(`Execution time: ${complexResult.executionTime}ms\n`);
  
  // Example 4: Weather check
  console.log('🌤️ Example 4: Weather Information');
  console.log('User: "What\'s the weather like in New York today?"');
  
  const weatherResult = await agentCoordinator.processRequest({
    userId,
    message: "What's the weather like in New York today?",
    context: { thread: emailResult.thread },
  });
  
  console.log(`Assistant: ${weatherResult.response}\n`);
  
  // Example 5: Memory and context
  console.log('🧠 Example 5: Memory and Context');
  console.log('User: "What was the meeting I scheduled earlier about?"');
  
  const memoryResult = await agentCoordinator.processRequest({
    userId,
    message: 'What was the meeting I scheduled earlier about? Can you remind me of the details?',
    context: { thread: emailResult.thread },
  });
  
  console.log(`Assistant: ${memoryResult.response}\n`);
  
  // Show conversation history
  console.log('📜 Conversation History:');
  const history = await agentCoordinator.getConversationHistory(userId, emailResult.thread, 5);
  history.forEach((msg: any, index: number) => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    const content = msg.content?.[0]?.text || '[No content]';
    console.log(`${index + 1}. ${role}: ${content.substring(0, 100)}...`);
  });
}

// Interactive mode for testing
async function interactiveMode() {
  console.log('\n💬 Interactive Mode - Chat with OmniAgent');
  console.log('Type "exit" to quit, "clear" to clear history\n');
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const userId = 'interactive-user-' + Date.now();
  let currentThread: string | undefined;
  
  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('👋 Goodbye!');
        rl.close();
        return;
      }
      
      if (input.toLowerCase() === 'clear') {
        await agentCoordinator.clearConversationHistory(userId, currentThread);
        console.log('✅ Conversation history cleared');
        currentThread = undefined;
        askQuestion();
        return;
      }
      
      console.log('⏳ Processing...');
      const result = await agentCoordinator.processRequest({
        userId,
        message: input,
        context: currentThread ? { thread: currentThread } : undefined,
      });
      
      if (!currentThread) {
        currentThread = result.thread;
      }
      
      console.log(`\n🤖 Assistant: ${result.response}`);
      console.log(`(Execution: ${result.executionTime}ms, Agents: ${result.agentsUsed.join(', ')})\n`);
      
      askQuestion();
    });
  };
  
  askQuestion();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    await interactiveMode();
  } else {
    await runExamples();
    console.log('\n✅ All examples completed!');
    console.log('Run with --interactive flag for interactive chat mode');
  }
}

// Run the examples
main().catch(console.error);
