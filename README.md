[![smithery badge](https://smithery.ai/badge/@Hint-Services/mcp-limitless)](https://smithery.ai/server/@Hint-Services/mcp-limitless)
[![npm version](https://img.shields.io/npm/v/mcp-limitless)](https://www.npmjs.com/package/mcp-limitless)

# Limitless AI MCP Server

A Model Context Protocol (MCP) server that connects AI assistants to Limitless AI lifelog data. This server enables seamless integration with your recorded conversations, thoughts, and daily activities from your Limitless AI pendant, allowing AI assistants to read, search, and analyze your personal lifelog.

## Why This Tool?

Limitless AI creates a continuous lifelog by recording your conversations and activities throughout the day. This MCP server bridges the gap between your lifelog data and AI assistants, enabling:

- **Personal Memory Access**: Retrieve specific conversations and moments from your lifelog
- **Intelligent Search**: Find relevant content across your entire recorded history
- **Timeline Analysis**: Understand patterns and evolution in your daily activities
- **Context-Aware Assistance**: AI assistants can reference your past conversations and experiences

## Features

- **Limitless AI Integration**: Direct access to your lifelog data via the official API
- **Type-Safe Implementation**: Written in TypeScript with comprehensive type definitions
- **Input Validation**: Robust validation for all API inputs using Zod schemas
- **Error Handling**: Graceful error handling with informative messages
- **MCP Integration**: Full compatibility with Claude, Cursor, Windsurf, Cline, and other MCP hosts

## Available Tools

### Lifelog Access

- **getLifelogs**: Retrieve lifelog entries with flexible filtering options:
  - Filter by date, timezone, and time ranges
  - Pagination support for large datasets
  - Sort by ascending or descending order

- **getLifelogEntry**: Get detailed information about a specific lifelog entry by ID

- **searchLifelogs**: Search through your lifelog content:
  - Full-text search across summaries and content
  - Date range filtering
  - Pagination for comprehensive results

## Use Cases

### For Personal Productivity
- **Meeting Follow-up**: AI can access your recorded meetings to create action items
- **Conversation Context**: Reference past discussions for better continuity
- **Reflection & Analysis**: Understand patterns in your daily interactions

### For Knowledge Workers
- **Research Assistant**: AI can recall relevant conversations and insights
- **Decision Support**: Reference past discussions when making decisions
- **Learning Reinforcement**: AI can help you remember key insights from conversations

### For Content Creation
- **Writing Support**: Pull relevant experiences and conversations for storytelling
- **Idea Development**: Track how concepts have evolved through your conversations
- **Personal Documentation**: Create summaries and insights from your lifelog data

## Installation

### Using Smithery (Recommended)

The easiest way to install Limitless AI MCP is using Smithery:

```bash
# For Claude Desktop
npx -y @smithery/cli install @Hint-Services/mcp-limitless --client claude

# For Cursor
npx -y @smithery/cli install @Hint-Services/mcp-limitless --client cursor

# For Windsurf
npx -y @smithery/cli install @Hint-Services/mcp-limitless --client windsurf

# For Cline
npx -y @smithery/cli install @Hint-Services/mcp-limitless --client cline
```

### Manual Installation

```bash
npm install mcp-limitless
```

## Configuration

Add the server to your MCP settings file with the following configuration:

```json
{
  "mcpServers": {
    "limitless": {
      "command": "npx",
      "args": ["-y", "mcp-limitless"],
      "env": {
        "LIMITLESS_API_KEY": "your-limitless-api-key"
      }
    }
  }
}
```

### Required Environment Variables

- `LIMITLESS_API_KEY`: Your Limitless AI API key ([get it here](https://www.limitless.ai/developers))

### Optional Environment Variables

- `LIMITLESS_BASE_URL`: Custom API base URL (defaults to `https://api.limitless.ai`)

### Getting Your API Key

1. Visit [Limitless AI Developer Platform](https://www.limitless.ai/developers)
2. Sign in to your Limitless account
3. Navigate to Developer settings
4. Generate a new API key
5. **Important**: Never share your API key or commit it to source control

## Example Workflows

### Getting Today's Lifelog Entries

```json
{
  "tool": "getLifelogs",
  "arguments": {
    "date": "2024-01-15",
    "timezone": "America/Los_Angeles",
    "limit": 10
  }
}
```

### Finding Specific Conversations

```json
{
  "tool": "searchLifelogs",
  "arguments": {
    "query": "meeting with Sarah about project planning",
    "limit": 5
  }
}
```

### Getting Entries from a Date Range

```json
{
  "tool": "getLifelogs",
  "arguments": {
    "date": "2024-01-15",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "timezone": "America/New_York"
  }
}
```

### Retrieving a Specific Entry

```json
{
  "tool": "getLifelogEntry",
  "arguments": {
    "lifelog_id": "entry_12345"
  }
}
```

### Searching Across Multiple Days

```json
{
  "tool": "searchLifelogs",
  "arguments": {
    "query": "quarterly planning",
    "date_from": "2024-01-01",
    "date_to": "2024-01-31",
    "limit": 10
  }
}
```

## API Limitations

- The Limitless AI API is currently in beta
- Maximum 10 entries per request
- Only supports Pendant device data currently
- Search functionality is implemented locally (API search coming soon)

## Project Structure

```
mcp-limitless/
├── src/
│   ├── index.ts          # Main MCP server entry point
│   └── limitless/        # Limitless AI integration
│       ├── client.ts     # Limitless client implementation
│       └── types.ts      # TypeScript type definitions
├── docs/                 # Documentation
├── package.json          # Project configuration
└── tsconfig.json         # TypeScript configuration
```

## For Developers

### Development Commands

- `pnpm install` - Install dependencies
- `pnpm run build` - Build the project
- `pnpm run dev` - Run in development mode with inspector
- `pnpm run inspector` - Launch MCP inspector for testing
- `pnpm run test` - Run tests

### API Reference

The server implements the following MCP tools:

- `getLifelogs` - Retrieve lifelog entries with filtering
- `getLifelogEntry` - Get specific lifelog entry by ID
- `searchLifelogs` - Search through lifelog content

For detailed API documentation, see the [Limitless AI Developer Documentation](https://www.limitless.ai/developers).

## Privacy & Security

- Your API key is used only to authenticate with Limitless AI's official API
- No data is stored or cached by this MCP server
- All communication is directly between your client and Limitless AI's servers
- Follow Limitless AI's privacy policy and terms of service

## Troubleshooting

### API Key Issues
- Ensure your API key is valid and not expired
- Check that you're using the correct environment variable name: `LIMITLESS_API_KEY`
- Verify your account has API access enabled

### No Data Returned
- Confirm your Limitless pendant is recording data
- Check the date ranges in your queries
- Verify your timezone settings

### Connection Issues
- Check your internet connection
- Verify the API base URL is correct
- Ensure Limitless AI services are operational

## Learn More

For further information, refer to:

- [Limitless AI Developer Documentation](https://www.limitless.ai/developers): Official API documentation
- [Model Context Protocol Documentation](https://modelcontextprotocol.io): MCP architecture and design principles
- [Smithery - MCP Server Registry](https://smithery.ai/docs): Guidelines for publishing MCP servers
- [MCP TypeScript SDK Documentation](https://modelcontextprotocol.io/typescript): Comprehensive TypeScript SDK documentation

## About Hint Services

> "The future is already here, it's just unevenly distributed"
>
> — William Gibson, Author

Hint Services is a boutique consultancy with a mission to develop and expand how user interfaces leverage artificial intelligence technology. We architect ambition at the intersection of AI and User Experience, founded and led by Ben Hofferber.

We offer specialized AI workshops for design teams looking to embrace AI tools without becoming developers. [Learn more about our training and workshops](https://hint.services/training-workshops).