/**
 * Limitless MCP Server
 *
 * A Model Context Protocol server for accessing Limitless AI lifelog data.
 * This server enables AI assistants to interact with your recorded conversations,
 * thoughts, and daily activities from your Limitless AI pendant.
 *
 * Features:
 * - Lifelog entry retrieval with flexible filtering
 * - Search functionality for recorded content
 * - Timeline analysis of your daily activities
 * - Content summarization and analysis
 *
 * For more information about MCP, visit:
 * https://modelcontextprotocol.io
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LimitlessClient } from "./limitless/client.js";
import { LimitlessConfigSchema } from "./limitless/types.js";

// Read Limitless config from environment variables
const limitlessApiKey = process.env.LIMITLESS_API_KEY;
const limitlessBaseUrl =
  process.env.LIMITLESS_BASE_URL || "https://api.limitless.ai";

if (!limitlessApiKey) {
  throw new Error(
    "Environment variable LIMITLESS_API_KEY is required. Get your API key from https://www.limitless.ai/developers"
  );
}

// Validate and create Limitless client config
const limitlessConfig = LimitlessConfigSchema.parse({
  apiKey: limitlessApiKey,
  baseUrl: limitlessBaseUrl,
});

// Create LimitlessClient with full config
const limitlessClient = new LimitlessClient(limitlessConfig);

/**
 * Create a new MCP server instance with full capabilities
 */
const server = new McpServer({
  name: "mcp-limitless",
  version: "0.1.0",
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
    streaming: true,
  },
});

/**
 * Helper function to send log messages to the client
 */
function logMessage(level: "info" | "warn" | "error", message: string) {
  console.error(`[${level.toUpperCase()}] ${message}`);
}

/**
 * Set up error handling for the server
 */
process.on("uncaughtException", (error: Error) => {
  logMessage("error", `Uncaught error: ${error.message}`);
  console.error("Server error:", error);
});

// Register Limitless tools
try {
  limitlessClient.registerLimitlessTools(server);
  logMessage("info", "Successfully registered all Limitless AI tools");
} catch (error) {
  logMessage(
    "error",
    `Failed to register tools: ${
      error instanceof Error ? error.message : "Unknown error"
    }`
  );
  process.exit(1);
}

/**
 * Set up proper cleanup on process termination
 */
async function cleanup() {
  try {
    await server.close();
    logMessage("info", "Server shutdown completed");
  } catch (error) {
    logMessage(
      "error",
      `Error during shutdown: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    process.exit(0);
  }
}

// Handle termination signals
process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

/**
 * Main server startup function
 */
async function main() {
  try {
    // Set up communication with the MCP host using stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logMessage("info", "MCP Server started successfully");
    console.error("MCP Server running on stdio transport");
  } catch (error) {
    logMessage(
      "error",
      `Failed to start server: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
