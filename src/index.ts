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
import { fileURLToPath } from "node:url";
import type { z } from "zod";
import { LimitlessClient } from "./limitless/client.js";
import { LimitlessConfigSchema } from "./limitless/types.js";

export const configSchema = LimitlessConfigSchema;

export default function createServer({
  config = {},
}: {
  config?: Partial<z.infer<typeof configSchema>>;
} = {}) {
  // Parse config with defaults
  const parsedConfig = configSchema.parse({
    apiKey: config?.apiKey || process.env.LIMITLESS_API_KEY || "",
    baseUrl:
      config?.baseUrl ||
      process.env.LIMITLESS_BASE_URL ||
      "https://api.limitless.ai",
  });

  const server = new McpServer({
    name: "mcp-limitless",
    version: "0.3.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      streaming: true,
    },
  });

  // Create LimitlessClient with parsed config
  const limitlessClient = new LimitlessClient(parsedConfig);

  // Register Limitless resources, prompts, and tools
  try {
    limitlessClient.registerLimitlessResources(server);
    logMessage("info", "Successfully registered all Limitless AI resources");

    limitlessClient.registerLimitlessPrompts(server);
    logMessage("info", "Successfully registered all Limitless AI prompts");

    limitlessClient.registerLimitlessTools(server);
    logMessage("info", "Successfully registered all Limitless AI tools");
  } catch (error) {
    logMessage(
      "error",
      `Failed to register resources, tools, and prompts: ${
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
  // Config will automatically use LIMITLESS_API_KEY from environment
  // Validation happens in LimitlessClient constructor for fail-fast behavior
  const server = createServer();

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

// Only run main if this file is executed directly (not imported as a module)
// This check ensures stdio transport is only used when running standalone,
// not when imported by Smithery for HTTP streaming
// Note: import.meta.url will be undefined when bundled to CJS by Smithery
if (import.meta.url && process.argv[1]) {
  try {
    const modulePath = fileURLToPath(import.meta.url);
    if (modulePath === process.argv[1]) {
      main().catch((error) => {
        console.error("Fatal error in main():", error);
        process.exit(1);
      });
    }
  } catch {
    // fileURLToPath might fail in bundled CJS, which is fine
    // In that case, we don't run main()
  }
}
