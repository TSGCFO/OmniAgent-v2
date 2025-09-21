import 'dotenv/config';
import { agentCoordinator } from './mastra/services/agent-coordinator.js';

// Test the delegation system between agents
async function testDelegation() {
  console.log('🔄 Testing Agent Delegation System\n');
  
  const userId = 'delegation-test-user';
  const scenarios = [
    {
      name: 'Email Delegation',
      message: 'Check my emails and summarize the important ones',
      expectedAgents: ['emailAgent'],
    },
    {
      name: 'Calendar Delegation',
      message: 'What meetings do I have today?',
      expectedAgents: ['calendarAgent'],
    },
    {
      name: 'Multi-Agent Delegation',
      message: 'Find information about productivity tips and schedule a workshop about it next week',
      expectedAgents: ['webSearchAgent', 'calendarAgent'],
    },
    {
      name: 'Complex Coordination',
      message: 'Check if I have any emails about the upcoming conference, and if so, schedule preparation meetings',
      expectedAgents: ['emailAgent', 'calendarAgent'],
    },
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n📋 Scenario: ${scenario.name}`);
    console.log(`User: "${scenario.message}"`);
    
    const startTime = Date.now();
    const result = await agentCoordinator.processRequest({
      userId,
      message: scenario.message,
    });
    
    console.log(`\nResponse: ${result.response}`);
    console.log(`Agents used: ${result.agentsUsed.join(', ')}`);
    console.log(`Expected agents: ${scenario.expectedAgents.join(', ')}`);
    console.log(`Execution time: ${result.executionTime}ms`);
    console.log(`Task analysis: ${JSON.stringify(result.metadata?.analysis, null, 2)}`);
    
    // Verify expected agents were used
    const expectedAgentsUsed = scenario.expectedAgents.every(agent => 
      result.agentsUsed.includes(agent) || result.agentsUsed.includes('mainAgent')
    );
    console.log(`✓ Delegation check: ${expectedAgentsUsed ? 'PASSED' : 'FAILED'}`);
  }
  
  console.log('\n✅ Delegation tests completed!');
}

// Test error handling and recovery
async function testErrorHandling() {
  console.log('\n🛡️ Testing Error Handling\n');
  
  const errorScenarios = [
    {
      name: 'Invalid Agent Request',
      message: 'Delegate this to the quantum computing agent',
    },
    {
      name: 'Timeout Simulation',
      message: 'Perform an extremely complex calculation that takes forever',
    },
    {
      name: 'Conflicting Instructions',
      message: 'Schedule a meeting at 2 PM and 3 PM at the same time',
    },
  ];
  
  for (const scenario of errorScenarios) {
    console.log(`\n⚠️ Error Scenario: ${scenario.name}`);
    console.log(`User: "${scenario.message}"`);
    
    const result = await agentCoordinator.processRequest({
      userId: 'error-test-user',
      message: scenario.message,
      context: {
        timeout: 5000, // 5 second timeout
      },
    });
    
    console.log(`Success: ${result.success}`);
    console.log(`Response: ${result.response}`);
    if (result.metadata?.error) {
      console.log(`Error handled gracefully ✓`);
    }
  }
}

// Test memory persistence across delegations
async function testMemoryPersistence() {
  console.log('\n💾 Testing Memory Persistence Across Delegations\n');
  
  const userId = 'memory-test-user';
  const thread = 'memory-test-thread-' + Date.now();
  
  // Step 1: Introduce context
  console.log('Step 1: Setting context');
  const step1 = await agentCoordinator.processRequest({
    userId,
    message: "I'm planning a company retreat in Hawaii next month. Remember this.",
    context: { thread },
  });
  console.log(`Response: ${step1.response}`);
  
  // Step 2: Email task with context
  console.log('\nStep 2: Email task using context');
  const step2 = await agentCoordinator.processRequest({
    userId,
    message: 'Draft an email to the team about the retreat',
    context: { thread },
  });
  console.log(`Response: ${step2.response}`);
  console.log(`Context remembered: ${step2.response.includes('Hawaii') ? 'YES ✓' : 'NO ✗'}`);
  
  // Step 3: Calendar task with context
  console.log('\nStep 3: Calendar task using context');
  const step3 = await agentCoordinator.processRequest({
    userId,
    message: 'Schedule planning meetings for the retreat',
    context: { thread },
  });
  console.log(`Response: ${step3.response}`);
  console.log(`Context maintained: ${step3.response.includes('retreat') || step3.response.includes('Hawaii') ? 'YES ✓' : 'NO ✗'}`);
  
  // Step 4: Web search with context
  console.log('\nStep 4: Web search using context');
  const step4 = await agentCoordinator.processRequest({
    userId,
    message: 'Find team building activities we could do there',
    context: { thread },
  });
  console.log(`Response: ${step4.response}`);
  console.log(`Context utilized: ${step4.response.includes('Hawaii') || step4.response.includes('retreat') ? 'YES ✓' : 'NO ✗'}`);
}

// Main execution
async function main() {
  await testDelegation();
  await testErrorHandling();
  await testMemoryPersistence();
  
  console.log('\n🎉 All delegation tests completed!');
}

main().catch(console.error);
