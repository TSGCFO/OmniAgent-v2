# MCP Resources and Prompts Implementation

This document describes the enhanced MCP (Model Context Protocol) implementation that now includes comprehensive support for accessing MCP Resources and MCP Prompts.

## Overview

The MCP implementation has been enhanced to support:

1. **MCP Resources**: Access to data and content (files, databases, API responses, etc.) exposed by MCP servers
2. **MCP Prompts**: Access to reusable templates for standardized LLM interactions

## Implementation Details

### 1. Enhanced MCP Configuration (`src/mastra/mcp/mcp-config.ts`)

Added comprehensive functions for accessing resources and prompts:

#### Resource Functions

- `getMCPResources()`: List all available resources from all servers
- `getMCPResourceTemplates()`: Get resource templates for dynamic URIs
- `readMCPResource(serverName, uri)`: Read specific resource content
- `subscribeMCPResource(serverName, uri)`: Subscribe to resource updates
- `unsubscribeMCPResource(serverName, uri)`: Unsubscribe from updates
- `onMCPResourceUpdated(serverName, handler)`: Set up update handlers
- `onMCPResourceListChanged(serverName, handler)`: Monitor resource list changes

#### Prompt Functions

- `getMCPPrompts()`: List all available prompts from all servers
- `getMCPPrompt(params)`: Get specific prompt with its messages
- `onMCPPromptListChanged(serverName, handler)`: Monitor prompt list changes

### 2. MCP Resource Tools (`src/mastra/tools/mcp-resource-tool.ts`)

Created tools that agents can use to interact with MCP resources:

- **listMCPResourcesTool**: List and filter available resources
- **readMCPResourceTool**: Read resource content
- **listMCPResourceTemplatesTool**: Discover resource templates
- **manageMCPResourceSubscriptionTool**: Subscribe/unsubscribe to resources
- **searchMCPResourcesTool**: Search through resource content

### 3. MCP Prompt Tools (`src/mastra/tools/mcp-prompt-tool.ts`)

Created tools for working with MCP prompts:

- **listMCPPromptsTool**: List and filter available prompts
- **getMCPPromptTool**: Get specific prompt with messages
- **findMCPPromptsTool**: Find prompts by category or purpose
- **executeMCPPromptTool**: Execute prompts with arguments
- **compareMCPPromptsTool**: Compare multiple prompts

### 4. Main Agent Integration

Updated the main agent (`src/mastra/agents/main-agent.ts`) to:

- Include all MCP resource and prompt tools
- Added capabilities in agent instructions for MCP resource access and prompt utilization

## Usage Examples

### Direct API Usage

```javascript
// List all resources
const resources = await getMCPResources();

// Read a specific resource
const content = await readMCPResource('filesystem', 'file:///README.md');

// Get all prompts
const prompts = await getMCPPrompts();

// Execute a prompt
const promptData = await getMCPPrompt({
  serverName: 'rube',
  name: 'analysis-prompt',
  args: { topic: 'market trends' }
});
```

### Using with Agents

Agents can now:

- List and read resources from any connected MCP server
- Search through resource content
- Execute pre-built prompts for specialized tasks
- Compare different prompts to choose the best one

Example agent queries:

- "List all available MCP resources and tell me what types are available"
- "Find and read any markdown documentation files"
- "What MCP prompts are available for data analysis?"
- "Use the slack-digest prompt to summarize yesterday's activity"

## Test Scripts

Several test scripts demonstrate the functionality:

1. **`npm run test:mcp-simple`**: Basic test of MCP resources and prompts
2. **`npm run test:mcp`**: Full integration test with main agent
3. **`npm run example:resources`**: Detailed resource examples
4. **`npm run example:prompts`**: Detailed prompt examples

## Current MCP Servers

The system is configured to connect to:

- **Rube MCP Server**: Provides 100+ app integrations (requires `RUBE_MCP_TOKEN`)
- **Optional servers**: Weather, Email, Calendar, Filesystem, GitHub (if configured)

## Benefits

1. **Dynamic Content Access**: Agents can read files, databases, and other resources exposed by MCP servers
2. **Reusable Prompts**: Use pre-built, tested prompts for common tasks
3. **Real-time Updates**: Subscribe to resource changes for live data
4. **Cross-Server Search**: Search content across multiple MCP servers
5. **Prompt Comparison**: Compare multiple prompts to find the best fit

## Future Enhancements

- Automatic resource caching for frequently accessed content
- Prompt composition (combining multiple prompts)
- Resource transformation tools
- Enhanced subscription management with webhooks
