# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Limitless AI MCP is a Model Context Protocol (MCP) server that connects AI assistants to Limitless AI lifelog data. It enables seamless access to your recorded conversations, thoughts, and daily activities from your Limitless AI pendant, allowing AI assistants to read, search, and analyze your personal lifelog.

## Key Commands

### Development
- `pnpm install` - Install dependencies
- `pnpm run build` - Build the project (includes linting and formatting)
- `pnpm run dev` - Run in development mode with inspector
- `pnpm run watch` - Watch mode for automatic recompilation
- `pnpm run debug:watch` - Debug mode with watch

### Code Quality
- `pnpm run lint:fix` - Fix linting issues with Biome
- `pnpm run format:fix` - Format code with Biome
- `pnpm run clean` - Clean build artifacts

### Debugging
- `pnpm run inspector` - Launch MCP inspector for testing tools
- `pnpm run logs` - View last 20 lines of MCP logs
- `pnpm run debug` - Run with Node.js debugger attached

## Architecture Overview

The project follows a clean modular architecture:

### Core Components
- **`src/index.ts`**: MCP server initialization using stdio transport. Handles server lifecycle, environment configuration, and graceful shutdown.
- **`src/limitless/client.ts`**: Encapsulates all Limitless AI API interactions via Axios. Implements centralized error handling and tool registration.
- **`src/limitless/types.ts`**: TypeScript type definitions for Limitless AI API and configuration.

### Available MCP Tools
1. **`getLifelogs`**: Retrieves lifelog entries with flexible filtering options (date, timezone, time ranges)
2. **`getLifelogEntry`**: Gets detailed information about a specific lifelog entry by ID
3. **`searchLifelogs`**: Searches through lifelog content and summaries with full-text search capabilities

### Key Design Patterns
- **Limitless AI-focused design**: Optimized for accessing personal lifelog data from Limitless AI pendant
- **Environment-based configuration**: API access via `LIMITLESS_API_KEY` and optional `LIMITLESS_BASE_URL`
- **Fail-fast initialization**: Server won't start without required API key configuration
- **Centralized error handling**: All API requests go through `handleRequest` wrapper with comprehensive error handling
- **Type safety**: Zod schemas for runtime validation of all tool inputs and API responses
- **Pagination support**: Cursor-based pagination for large lifelog datasets

### Development Notes
- Uses Biome for linting and formatting (configured in `biome.json`)
- TypeScript target: ES2020 with Node16 module resolution
- Pre-build hooks ensure code quality before compilation
- MCP Inspector available for testing tool interactions
- Vitest configured for comprehensive testing of API client and types
- Axios used for HTTP client with proper error handling and timeout configuration