# Intelligent MCP Usage in OmniAgent

## Overview

The agents in OmniAgent are now configured to **automatically and intelligently** use MCP resources and prompts without requiring explicit instructions from users. This is achieved through:

1. **Enhanced Agent Instructions**: The main agent is instructed to ALWAYS check for relevant MCP resources and prompts first
2. **Intelligent Helper Tool**: A smart tool that analyzes user queries and finds relevant resources/prompts
3. **Automatic Integration**: All agents have access to MCP tools and are configured to use them proactively

## How It Works

### 1. Intelligent MCP Helper Tool

The `intelligentMCPHelperTool` is the key to automatic MCP usage:

```typescript
// Automatically called for EVERY user request
intelligentMCPHelper({
  userQuery: "How can I analyze my Slack channels?",
  queryType: "analysis" // optional, auto-detected
})

// Returns:
{
  relevantResources: [...],  // Relevant documentation, guides
  relevantPrompts: [...],    // Slack analysis prompts
  suggestions: [...],        // Specific guidance
  shouldUseResources: true,
  shouldUsePrompts: true
}
```

### 2. Keyword Extraction & Matching

The helper intelligently:
- Extracts meaningful keywords from queries
- Identifies integration names (Slack, GitHub, etc.)
- Matches against resource names, URIs, and descriptions
- Scores relevance based on multiple factors

### 3. Automatic Workflow

When a user asks a question:

1. **Agent receives query** → "Can you help me with Slack analysis?"
2. **Runs intelligentMCPHelper** → Finds Slack-related prompts and resources
3. **Reads relevant resources** → Gets documentation or guides
4. **Executes relevant prompts** → Uses Slack analysis templates
5. **Combines with response** → Provides comprehensive, structured answer

## Examples of Intelligent Usage

### Example 1: Getting Started
**User**: "How do I get started?"

**Agent automatically**:
- Finds the "get-started" prompt
- Executes it to provide structured onboarding
- Lists available capabilities from resources

### Example 2: Integration Help
**User**: "I need help with Slack"

**Agent automatically**:
- Finds all Slack-related prompts (digest, insights, etc.)
- Searches for Slack documentation in resources
- Offers specific Slack tools and capabilities

### Example 3: Analysis Request
**User**: "Analyze my team's productivity"

**Agent automatically**:
- Finds analysis prompts
- Looks for productivity-related resources
- Structures response using best practices

## Configuration

### Agent Instructions Enhancement

The main agent includes specific instructions:

```markdown
## Intelligent MCP Usage:
**IMPORTANT: Always use the intelligentMCPHelper tool FIRST for ANY user request!**

The intelligentMCPHelper will automatically:
- Find relevant MCP resources and prompts based on the user's query
- Provide suggestions on which resources/prompts to use
- Give you relevance reasons for each finding
```

### Tool Priority

Tools are ordered to encourage MCP usage:

1. Core orchestration tools
2. **intelligentMCPHelper** (highlighted as primary)
3. MCP resource tools
4. MCP prompt tools
5. Other dynamic tools

## Benefits

1. **Zero Learning Curve**: Users don't need to know about MCP
2. **Automatic Best Practices**: Agents use proven prompts and templates
3. **Dynamic Capabilities**: As new resources/prompts are added, agents automatically use them
4. **Consistent Responses**: Prompts ensure structured, high-quality outputs
5. **Self-Documenting**: Agents can explain what resources they're using

## Testing Intelligent Usage

Run the intelligent MCP test:

```bash
npm run test:intelligent
```

This demonstrates how agents automatically find and use relevant MCP capabilities for various queries.

## Future Enhancements

1. **Learning**: Track which resources/prompts are most useful
2. **Caching**: Cache frequently used resources for faster access
3. **Preemptive Loading**: Load likely resources based on conversation context
4. **Custom Scoring**: Adjust relevance scoring based on user preferences
