# OmniAgent - Unified AI Assistant Multi-Agent System

A comprehensive multi-agent AI assistant built on the Mastra framework that serves as a single interface for managing all digital tasks across multiple platforms.

## 🎯 Overview

OmniAgent eliminates the need to juggle multiple apps and AI tools by providing:

- **Single Interface**: One conversational AI for all your digital tasks
- **Persistent Memory**: Learns from every interaction and remembers your preferences
- **Intelligent Delegation**: Automatically routes tasks to specialized sub-agents
- **Seamless Integration**: Connects with external services via MCP (Model Context Protocol)

## 🏗️ Architecture

### Core Components

1. **Main Orchestrator Agent** (`mainAgent`)
   - Natural language interface for users
   - Analyzes requests and delegates to appropriate sub-agents
   - Maintains conversation context and coordination

2. **Specialized Sub-Agents**
   - **Email Agent**: Email search, composition, and management
   - **Calendar Agent**: Scheduling, meeting management, time optimization
   - **Web Search Agent**: Information retrieval and research synthesis
   - **Weather Agent**: Weather information and forecasts

3. **Memory System**
   - **Working Memory**: Persistent user preferences and patterns
   - **Semantic Recall**: RAG-based retrieval of past conversations
   - **Conversation History**: Recent message context

4. **MCP Integration**
   - Connect to external MCP servers for additional capabilities
   - Expose the unified agent system as an MCP server

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration
```

### Required Environment Variables

```env
# OpenAI API Key (required)
OPENAI_API_KEY=your-api-key

# Database Configuration
DATABASE_URL=file:./data/omniagent.db
VECTOR_DB_URL=file:./data/vector.db

# Optional MCP Server URLs
MCP_WEATHER_SERVER_URL=http://localhost:8080/mcp
MCP_EMAIL_SERVER_URL=
MCP_CALENDAR_SERVER_URL=
```

### Running the System

```bash
# Run interactive chat mode
npm run test:example -- --interactive

# Run example scenarios
npm run test:example

# Test main agent directly
npm run test:main

# Test delegation system
npm run test:delegation

# Start Mastra development server
npm run dev
```

## 💬 Usage Examples

### Basic Interaction

```typescript
import { agentCoordinator } from './mastra/services/agent-coordinator';

// Simple request
const result = await agentCoordinator.processRequest({
  userId: 'user-123',
  message: 'Check my emails and summarize anything urgent'
});

console.log(result.response);
```

### Complex Multi-Agent Tasks

```typescript
// Complex task requiring multiple agents
const result = await agentCoordinator.processRequest({
  userId: 'user-123',
  message: 'Research AI trends, draft an email summary, and schedule a presentation next week',
  context: {
    priority: 'high'
  }
});
```

### Using Memory Context

```typescript
// First interaction - system learns preferences
await agentCoordinator.processRequest({
  userId: 'user-123',
  message: "I'm Sarah from marketing, I prefer casual emails"
});

// Later interaction - system remembers
await agentCoordinator.processRequest({
  userId: 'user-123',
  message: "Draft an email to the team about our new campaign"
});
// The email will be drafted in a casual tone
```

## 🔧 Configuration

### System Configuration (`src/mastra/config/system-config.ts`)

```typescript
{
  memory: {
    workingMemoryScope: 'resource',  // or 'thread'
    semanticRecallTopK: 5,
    lastMessagesCount: 20,
    enableSemanticRecall: true,
    enableWorkingMemory: true
  },
  agents: {
    mainModel: 'gpt-4o',
    subAgentModel: 'gpt-4o-mini',
    temperature: 0.7,
    maxSteps: 5
  },
  features: {
    enableProactiveSuggestions: false,  // Phase 2
    enableMultiModal: false,            // Phase 2
    enableVoice: false                  // Phase 2
  }
}
```

### Memory Configuration

Working memory template stores persistent information:

- Personal information (name, location, timezone)
- Preferences (email style, calendar preferences)
- Current context (active projects, deadlines)
- Learned patterns (common tasks, communication style)

## 🛠️ Extending the System

### Adding New Sub-Agents

1. Create agent file in `src/mastra/agents/`
2. Define agent with specialized instructions
3. Add specific tools for the agent
4. Register in `src/mastra/index.ts`
5. Update delegation tool mapping

### Adding MCP Servers

Configure additional MCP servers in `src/mastra/mcp/mcp-config.ts`:

```typescript
servers.myServer = {
  url: new URL(process.env.MY_MCP_SERVER_URL),
  requestInit: {
    headers: {
      'Authorization': `Bearer ${process.env.MY_API_KEY}`
    }
  }
};
```

### Exposing as MCP Server

The system can be exposed as an MCP server for use by other tools:

```typescript
import { startOmniAgentMCPServer } from './mastra/mcp/omniagent-mcp-server';

// Start as stdio server
await startOmniAgentMCPServer('stdio');
```

## 📊 Performance Considerations

- **Token Limits**: Memory processors manage context window
- **Delegation Overhead**: Each sub-agent call adds latency
- **Semantic Search**: Embedding generation impacts response time
- **Storage**: LibSQL for local development, PostgreSQL for production

## 🔒 Security Considerations

- Store API keys securely in environment variables
- Implement user authentication for production
- Sanitize user inputs before processing
- Limit memory storage per user
- Implement rate limiting for API calls

## 🚧 Roadmap

### Phase 1 (Current)

- ✅ Core multi-agent architecture
- ✅ Memory system with semantic recall
- ✅ Basic email and calendar management
- ✅ Web search integration
- ✅ MCP connectivity

### Phase 2 (Planned)

- ⏳ Proactive suggestions based on patterns
- ⏳ Multi-modal input support (images, voice)
- ⏳ Advanced project management
- ⏳ Integration marketplace

### Phase 3 (Future)

- ⏳ Performance optimizations
- ⏳ Advanced workflow automation
- ⏳ Enterprise features
- ⏳ Developer tools and SDK

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

[Your License Here]

## 🙏 Acknowledgments

Built with [Mastra Framework](https://mastra.ai) and powered by OpenAI.
