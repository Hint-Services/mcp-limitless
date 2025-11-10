import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

import type {
  GetLifelogResponse,
  LifelogEntry,
  LimitlessConfig,
  ListLifelogsParams,
  ListLifelogsResponse,
  SearchLifelogsParams,
} from "./types.js";

export class LimitlessClient {
  private api: AxiosInstance;

  constructor(private config: LimitlessConfig) {
    // Validate and get API key with fallback to environment variable
    const apiKey = config.apiKey || process.env.LIMITLESS_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "Limitless API key is required. Provide it via config or set LIMITLESS_API_KEY environment variable. " +
          "Get your API key from https://www.limitless.ai/developers"
      );
    }

    // Initialize axios client with validated configuration
    this.api = axios.create({
      baseURL: config.baseUrl || "https://api.limitless.ai",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });
  }

  // Simplified error handler for API requests
  private async handleRequest<T>(
    request: () => Promise<{ data: T }>
  ): Promise<T> {
    try {
      const { data } = await request();
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        const status = error.response?.status || "unknown";
        throw new Error(`Limitless API error (${status}): ${message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Limitless API error: ${error.message}`);
      }
      throw new Error(`Limitless API error: ${String(error)}`);
    }
  }

  /**
   * Get list of lifelog entries
   */
  async getLifelogs(
    params: ListLifelogsParams = { limit: 10 }
  ): Promise<ListLifelogsResponse> {
    return this.handleRequest(async () => {
      return this.api.get("/v1/lifelogs", { params });
    });
  }

  /**
   * Get a specific lifelog entry by ID
   */
  async getLifelog(lifelogId: string): Promise<LifelogEntry> {
    const response = await this.handleRequest<GetLifelogResponse>(async () => {
      return this.api.get(`/v1/lifelogs/${lifelogId}`);
    });
    return response.data.lifelog;
  }

  /**
   * Search lifelog entries (mock implementation as API doesn't have search yet)
   */
  async searchLifelogs(
    params: SearchLifelogsParams
  ): Promise<ListLifelogsResponse> {
    // Since the API doesn't have a search endpoint yet, we'll get all entries
    // and filter them locally. This is a temporary solution.
    const allEntries = await this.getLifelogs({
      date: params.date_from,
      limit: params.limit,
      cursor: params.cursor,
    });

    // Simple text search in title, markdown content, and contents
    const query = params.query.toLowerCase();
    const filteredEntries = allEntries.data.lifelogs.filter((entry) => {
      // Search in title
      if (entry.title.toLowerCase().includes(query)) {
        return true;
      }

      // Search in markdown if available
      if (entry.markdown?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in content items
      return entry.contents.some((item) =>
        item.content.toLowerCase().includes(query)
      );
    });

    return {
      data: {
        lifelogs: filteredEntries,
      },
      meta: allEntries.meta,
    };
  }

  registerLimitlessResources(server: McpServer) {
    // Resource for today's lifelogs
    server.resource(
      "today-lifelogs",
      "limitless://lifelogs/today",
      {
        description: "Today's lifelog entries from your Limitless AI pendant",
        mimeType: "text/markdown",
      },
      async () => {
        try {
          const today = new Date().toISOString().split("T")[0];
          const response = await this.getLifelogs({ date: today, limit: 10 });

          if (response.data.lifelogs.length === 0) {
            return {
              contents: [
                {
                  uri: "limitless://lifelogs/today",
                  text: `No lifelog entries found for today (${today}).`,
                  mimeType: "text/plain",
                },
              ],
            };
          }

          let content = `# Today's Lifelog Entries (${today})\n\n`;
          content += `Found ${response.data.lifelogs.length} entries:\n\n`;

          for (const entry of response.data.lifelogs) {
            content += `## ${entry.title}\n`;
            content += `**ID:** ${entry.id}\n`;
            content += `**Time:** ${new Date(entry.startTime).toLocaleString()} - ${new Date(entry.endTime).toLocaleString()}\n`;
            if (entry.isStarred) {
              content += "**Status:** ⭐ Starred\n";
            }
            content += "\n";
          }

          return {
            contents: [
              {
                uri: "limitless://lifelogs/today",
                text: content,
                mimeType: "text/markdown",
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri: "limitless://lifelogs/today",
                text: `Error fetching today's lifelogs: ${error instanceof Error ? error.message : "Unknown error"}`,
                mimeType: "text/plain",
              },
            ],
          };
        }
      }
    );

    // Resource for recent lifelogs (last 7 days)
    server.resource(
      "recent-lifelogs",
      "limitless://lifelogs/recent",
      {
        description: "Recent lifelog entries from the past 7 days",
        mimeType: "text/markdown",
      },
      async () => {
        try {
          const response = await this.getLifelogs({ limit: 10 });

          if (response.data.lifelogs.length === 0) {
            return {
              contents: [
                {
                  uri: "limitless://lifelogs/recent",
                  text: "No recent lifelog entries found.",
                  mimeType: "text/plain",
                },
              ],
            };
          }

          let content = "# Recent Lifelog Entries\n\n";
          content += `Found ${response.data.lifelogs.length} recent entries:\n\n`;

          for (const entry of response.data.lifelogs) {
            content += `## ${entry.title}\n`;
            content += `**ID:** ${entry.id}\n`;
            content += `**Time:** ${new Date(entry.startTime).toLocaleString()}\n`;
            content += "\n";
          }

          return {
            contents: [
              {
                uri: "limitless://lifelogs/recent",
                text: content,
                mimeType: "text/markdown",
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri: "limitless://lifelogs/recent",
                text: `Error fetching recent lifelogs: ${error instanceof Error ? error.message : "Unknown error"}`,
                mimeType: "text/plain",
              },
            ],
          };
        }
      }
    );

    // Resource for this week's lifelogs
    server.resource(
      "week-lifelogs",
      "limitless://lifelogs/week",
      {
        description: "All lifelog entries from this week (Monday to Sunday)",
        mimeType: "text/markdown",
      },
      async () => {
        try {
          // Calculate start of current week (Monday)
          const today = new Date();
          const dayOfWeek = today.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const monday = new Date(today);
          monday.setDate(today.getDate() + mondayOffset);
          const mondayStr = monday.toISOString().split("T")[0];

          const response = await this.getLifelogs({
            date: mondayStr,
            limit: 10,
          });

          if (response.data.lifelogs.length === 0) {
            return {
              contents: [
                {
                  uri: "limitless://lifelogs/week",
                  text: `No lifelog entries found for this week (starting ${mondayStr}).`,
                  mimeType: "text/plain",
                },
              ],
            };
          }

          let content = `# This Week's Lifelog Entries\n\n`;
          content += `Week starting: ${mondayStr}\n\n`;
          content += `Found ${response.data.lifelogs.length} entries:\n\n`;

          for (const entry of response.data.lifelogs) {
            content += `## ${entry.title}\n`;
            content += `**ID:** ${entry.id}\n`;
            content += `**Time:** ${new Date(entry.startTime).toLocaleString()}\n`;
            if (entry.isStarred) {
              content += "**Status:** ⭐ Starred\n";
            }
            content += "\n";
          }

          return {
            contents: [
              {
                uri: "limitless://lifelogs/week",
                text: content,
                mimeType: "text/markdown",
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri: "limitless://lifelogs/week",
                text: `Error fetching this week's lifelogs: ${error instanceof Error ? error.message : "Unknown error"}`,
                mimeType: "text/plain",
              },
            ],
          };
        }
      }
    );

    // Resource for starred/important lifelogs
    server.resource(
      "starred-lifelogs",
      "limitless://lifelogs/starred",
      {
        description: "All starred/important lifelog entries",
        mimeType: "text/markdown",
      },
      async () => {
        try {
          const response = await this.getLifelogs({ limit: 10 });

          // Filter for starred entries
          const starredEntries = response.data.lifelogs.filter(
            (entry) => entry.isStarred
          );

          if (starredEntries.length === 0) {
            return {
              contents: [
                {
                  uri: "limitless://lifelogs/starred",
                  text: "No starred lifelog entries found. Star important entries in your Limitless app to see them here.",
                  mimeType: "text/plain",
                },
              ],
            };
          }

          let content = "# Starred Lifelog Entries\n\n";
          content += `Found ${starredEntries.length} starred entries:\n\n`;

          for (const entry of starredEntries) {
            content += `## ⭐ ${entry.title}\n`;
            content += `**ID:** ${entry.id}\n`;
            content += `**Time:** ${new Date(entry.startTime).toLocaleString()}\n`;
            content += "\n";
          }

          return {
            contents: [
              {
                uri: "limitless://lifelogs/starred",
                text: content,
                mimeType: "text/markdown",
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri: "limitless://lifelogs/starred",
                text: `Error fetching starred lifelogs: ${error instanceof Error ? error.message : "Unknown error"}`,
                mimeType: "text/plain",
              },
            ],
          };
        }
      }
    );
  }

  registerLimitlessPrompts(server: McpServer) {
    // Prompt to review today's activities
    server.prompt(
      "review-today",
      "Review today's lifelog activities",
      async () => {
        const today = new Date().toISOString().split("T")[0];
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please review my lifelog entries from today (${today}). Summarize the key conversations, topics discussed, and any important moments. Use the getLifelogs tool with today's date.`,
              },
            },
          ],
        };
      }
    );

    // Prompt to search for specific topics
    server.prompt(
      "find-topic",
      "Search for a specific topic in lifelogs",
      {
        topic: z
          .string()
          .describe("The topic or keyword to search for in your lifelogs"),
      },
      async ({ topic }) => {
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Search my lifelog entries for discussions about "${topic}". Use the searchLifelogs tool and provide a summary of what was discussed, when it was discussed, and any key insights.`,
              },
            },
          ],
        };
      }
    );

    // Prompt to analyze recent patterns
    server.prompt(
      "analyze-week",
      "Analyze patterns from the past week",
      async () => {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Analyze my lifelog entries from the past week (starting from ${weekAgoStr}). Identify recurring themes, topics I've discussed multiple times, and any patterns in my conversations or activities. Use getLifelogs with appropriate date filters.`,
              },
            },
          ],
        };
      }
    );

    // Prompt to compare activities between two time periods
    server.prompt(
      "compare-dates",
      "Compare activities between two dates",
      {
        date1: z.string().describe("First date to compare (YYYY-MM-DD format)"),
        date2: z
          .string()
          .describe("Second date to compare (YYYY-MM-DD format)"),
      },
      async ({ date1, date2 }) => {
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Compare my lifelog entries from ${date1} and ${date2}. Analyze the differences in activities, topics discussed, people I interacted with, and overall patterns. Use getLifelogs for both dates and provide a detailed comparison.`,
              },
            },
          ],
        };
      }
    );

    // Prompt to extract key insights from a date range
    server.prompt(
      "extract-insights",
      "Extract key insights from a date range",
      {
        start_date: z
          .string()
          .describe("Start date for insight extraction (YYYY-MM-DD format)"),
        end_date: z
          .string()
          .optional()
          .describe(
            "End date for insight extraction (YYYY-MM-DD format, defaults to today)"
          ),
      },
      async ({ start_date, end_date }) => {
        const endDateStr = end_date || new Date().toISOString().split("T")[0];
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Extract key insights from my lifelog entries between ${start_date} and ${endDateStr}. Focus on: 1) Important decisions made, 2) Recurring themes or concerns, 3) Notable interactions or relationships, 4) Progress on ongoing projects, 5) Action items or commitments. Use searchLifelogs and getLifelogs to gather this information.`,
              },
            },
          ],
        };
      }
    );
  }

  registerLimitlessTools(server: McpServer) {
    // Tool to get lifelog entries
    server.tool(
      "getLifelogs",
      "Retrieve lifelog entries from your Limitless AI pendant. Access your recorded conversations, thoughts, and daily activities with flexible filtering options.",
      {
        date: z
          .string()
          .optional()
          .describe(
            "Filter entries by specific date in YYYY-MM-DD format (e.g., '2025-11-05'). If not specified, returns recent entries from the past 7 days."
          ),
        timezone: z
          .string()
          .optional()
          .describe(
            "IANA timezone for date filtering (e.g., 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'). Defaults to UTC if not specified."
          ),
        start_time: z
          .string()
          .optional()
          .describe(
            "Filter entries starting from this time (ISO 8601 format: '2025-11-05T14:30:00Z'). Use with end_time for precise time range queries."
          ),
        end_time: z
          .string()
          .optional()
          .describe(
            "Filter entries ending before this time (ISO 8601 format: '2025-11-05T18:00:00Z'). Use with start_time for precise time range queries."
          ),
        cursor: z
          .string()
          .optional()
          .describe(
            "Pagination cursor from previous response's meta.lifelogs.next_cursor field. Use this to retrieve the next page of results."
          ),
        sort_direction: z
          .enum(["asc", "desc"])
          .optional()
          .describe(
            "Sort order for results: 'asc' for oldest first (chronological), 'desc' for newest first (reverse chronological). Defaults to 'desc'."
          ),
        limit: z
          .number()
          .min(1)
          .max(10)
          .optional()
          .default(10)
          .describe(
            "Maximum number of lifelog entries to return per request (min: 1, max: 10). Defaults to 10. Use cursor parameter for additional pages."
          ),
      },
      {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      async (params) => {
        const response = await this.getLifelogs(params);

        if (response.data.lifelogs.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No lifelog entries found for the specified criteria.",
              },
            ],
          };
        }

        let formattedOutput = `Found ${response.data.lifelogs.length} lifelog entries`;
        if (params.date) {
          formattedOutput += ` for ${params.date}`;
        }
        formattedOutput += ":\n\n";

        for (const entry of response.data.lifelogs) {
          formattedOutput += `## ${entry.title}\n`;
          formattedOutput += `**ID:** ${entry.id}\n`;
          formattedOutput += `**Time:** ${new Date(entry.startTime).toLocaleString()} - ${new Date(entry.endTime).toLocaleString()}\n`;

          if (entry.isStarred) {
            formattedOutput += "⭐ **Starred**\n";
          }

          // Show summary of content
          const headings = entry.contents
            .filter((item) => item.type === "heading2")
            .map((item) => `• ${item.content}`)
            .join("\n");

          if (headings) {
            formattedOutput += `\n**Topics:**\n${headings}\n`;
          }

          formattedOutput += "\n---\n\n";
        }

        if (
          response.meta &&
          response.meta.lifelogs.count > response.data.lifelogs.length
        ) {
          formattedOutput += `💡 Showing ${response.data.lifelogs.length} of ${response.meta.lifelogs.count} total entries.\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: formattedOutput,
            },
          ],
        };
      }
    );

    // Tool to get a specific lifelog entry
    server.tool(
      "getLifelogEntry",
      "Retrieve a specific lifelog entry by its ID. Get detailed information about a particular recorded moment from your Limitless AI pendant.",
      {
        lifelog_id: z
          .string()
          .min(1)
          .describe(
            "The unique identifier of the lifelog entry to retrieve (e.g., 'lifelog_abc123xyz'). This ID is returned in the results from getLifelogs or searchLifelogs tools."
          ),
      },
      {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      async ({ lifelog_id }) => {
        const entry = await this.getLifelog(lifelog_id);

        let formattedOutput = `## ${entry.title}\n\n`;
        formattedOutput += `**ID:** ${entry.id}\n`;
        formattedOutput += `**Time:** ${new Date(entry.startTime).toLocaleString()} - ${new Date(entry.endTime).toLocaleString()}\n`;
        formattedOutput += `**Duration:** ${Math.round((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 60000)} minutes\n`;

        if (entry.isStarred) {
          formattedOutput += "⭐ **Starred**\n";
        }

        if (entry.updatedAt) {
          formattedOutput += `**Last Updated:** ${new Date(entry.updatedAt).toLocaleString()}\n`;
        }

        formattedOutput += "\n### Content:\n\n";

        // Format the content items
        for (const item of entry.contents) {
          if (item.type === "heading1") {
            formattedOutput += `# ${item.content}\n\n`;
          } else if (item.type === "heading2") {
            formattedOutput += `## ${item.content}\n\n`;
          } else if (item.type === "blockquote") {
            const speaker = item.speakerName || "Unknown";
            const time = item.startTime
              ? new Date(item.startTime).toLocaleTimeString()
              : "";
            formattedOutput += `> **${speaker}** ${time}: ${item.content}\n\n`;
          } else {
            formattedOutput += `${item.content}\n\n`;
          }
        }

        if (entry.markdown) {
          formattedOutput += `\n### Full Markdown:\n\n${entry.markdown}\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: formattedOutput,
            },
          ],
        };
      }
    );

    // Tool to search lifelog entries
    server.tool(
      "searchLifelogs",
      "Search through your lifelog entries from Limitless AI. Find specific conversations, topics, or moments by searching through the content and summaries of your recorded activities.",
      {
        query: z
          .string()
          .min(1)
          .describe(
            "Search query text to find in lifelog titles, summaries, and conversation content. Supports keywords, names, topics (e.g., 'project meeting', 'John Smith', 'budget discussion'). Search is case-insensitive."
          ),
        date_from: z
          .string()
          .optional()
          .describe(
            "Start date to limit search range in YYYY-MM-DD format (e.g., '2025-11-01'). Only entries from this date onwards will be searched. If omitted, searches all historical entries."
          ),
        date_to: z
          .string()
          .optional()
          .describe(
            "End date to limit search range in YYYY-MM-DD format (e.g., '2025-11-05'). Only entries up to this date will be searched. If omitted, searches up to present day."
          ),
        timezone: z
          .string()
          .optional()
          .describe(
            "IANA timezone for date range filtering (e.g., 'America/Los_Angeles', 'Europe/Paris', 'Asia/Singapore'). Affects interpretation of date_from and date_to. Defaults to UTC."
          ),
        cursor: z
          .string()
          .optional()
          .describe(
            "Pagination cursor from previous search response. Use this to load more results beyond the limit. Found in meta.lifelogs.next_cursor of the previous response."
          ),
        limit: z
          .number()
          .min(1)
          .max(10)
          .optional()
          .default(10)
          .describe(
            "Maximum number of matching entries to return (minimum: 1, maximum: 10). Defaults to 10. For more results, use the cursor parameter with subsequent requests."
          ),
      },
      {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      async (params) => {
        const response = await this.searchLifelogs(params);

        if (response.data.lifelogs.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No lifelog entries found matching "${params.query}".`,
              },
            ],
          };
        }

        let formattedOutput = `Found ${response.data.lifelogs.length} lifelog entries matching "${params.query}":\n\n`;

        for (const entry of response.data.lifelogs) {
          formattedOutput += `## ${entry.title}\n`;
          formattedOutput += `**ID:** ${entry.id}\n`;
          formattedOutput += `**Time:** ${new Date(entry.startTime).toLocaleString()} - ${new Date(entry.endTime).toLocaleString()}\n`;

          // Show relevant excerpt from contents
          const query = params.query.toLowerCase();
          const matchingItems = entry.contents.filter((item) =>
            item.content.toLowerCase().includes(query)
          );

          if (matchingItems.length > 0) {
            formattedOutput += "\n**Matching excerpts:**\n";
            for (const item of matchingItems.slice(0, 3)) {
              // Show up to 3 matches
              if (item.type === "blockquote") {
                const speaker = item.speakerName || "Unknown";
                formattedOutput += `> **${speaker}**: ${item.content}\n`;
              } else {
                formattedOutput += `> ${item.content}\n`;
              }
            }
            if (matchingItems.length > 3) {
              formattedOutput += `> ... and ${matchingItems.length - 3} more matches\n`;
            }
          }

          formattedOutput += "\n---\n\n";
        }

        if (
          response.meta &&
          response.data.lifelogs.length < response.meta.lifelogs.count
        ) {
          formattedOutput += `💡 Showing ${response.data.lifelogs.length} of ${response.meta.lifelogs.count} matching entries.\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: formattedOutput,
            },
          ],
        };
      }
    );
  }
}
