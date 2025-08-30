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
import type { z } from "zod";
import { LimitlessClient } from "./limitless/client.js";
import { LimitlessConfigSchema } from "./limitless/types.js";

export const configSchema = LimitlessConfigSchema;

export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "mcp-limitless",
    version: "0.2.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      streaming: true,
    },
  });

  // Create LimitlessClient with provided config
  const limitlessClient = new LimitlessClient(config);

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
    throw error;
  }

  return server;
}

/**
 * Helper function to send log messages to the client
 */
function logMessage(level: "info" | "warn" | "error", message: string) {
  console.error(`[${level.toUpperCase()}] ${message}`);
}

// Keep main function for stdio compatibility
async function main() {
  // Environment variable validation moved inside main()
  const limitlessApiKey = process.env.LIMITLESS_API_KEY;
  const limitlessBaseUrl =
    process.env.LIMITLESS_BASE_URL || "https://api.limitless.ai";

  if (!limitlessApiKey) {
    console.error(
      "Environment variable LIMITLESS_API_KEY is required. Get your API key from https://www.limitless.ai/developers"
    );
  }

  // Validate and create Limitless client config
  const limitlessConfig = LimitlessConfigSchema.parse({
    apiKey: limitlessApiKey,
    baseUrl: limitlessBaseUrl,
  });

  const server = createServer({
    config: limitlessConfig,
  });

  try {
    // Set up communication with the MCP host using stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("[INFO] MCP Server started successfully");
    console.error("MCP Server running on stdio transport");
  } catch (error) {
    console.error(
      `[ERROR] Failed to start server: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
}

// Only run main if this file is executed directly
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
