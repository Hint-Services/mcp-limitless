import { z } from "zod";

/**
 * Configuration for the Limitless API client
 */
export const LimitlessConfigSchema = z
  .object({
    apiKey: z
      .string()
      .optional()
      .describe(
        "Limitless API token. If not provided, will use LIMITLESS_API_KEY environment variable."
      ),
    baseUrl: z
      .string()
      .url()
      .optional()
      .default("https://api.limitless.ai")
      .describe(
        "Base URL for Limitless API. Defaults to https://api.limitless.ai"
      ),
  })
  .default({});

export type LimitlessConfig = z.infer<typeof LimitlessConfigSchema>;

/**
 * Content item within a lifelog entry
 */
export const LifelogContentItemSchema = z.object({
  content: z.string(),
  type: z.enum(["heading1", "heading2", "blockquote", "text"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startOffsetMs: z.number().optional(),
  endOffsetMs: z.number().optional(),
  speakerName: z.string().optional(),
});

export type LifelogContentItem = z.infer<typeof LifelogContentItemSchema>;

/**
 * Lifelog entry data structure
 */
export const LifelogEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  contents: z.array(LifelogContentItemSchema),
  markdown: z.string().optional(),
  isStarred: z.boolean().default(false),
  updatedAt: z.string().optional(),
});

export type LifelogEntry = z.infer<typeof LifelogEntrySchema>;

/**
 * Parameters for listing lifelogs
 */
export const ListLifelogsParamsSchema = z.object({
  date: z.string().optional(),
  timezone: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  cursor: z.string().optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
  limit: z.number().min(1).max(10).default(10),
});

export type ListLifelogsParams = z.infer<typeof ListLifelogsParamsSchema>;

/**
 * Response for listing lifelogs
 */
export const ListLifelogsResponseSchema = z.object({
  data: z.object({
    lifelogs: z.array(LifelogEntrySchema),
  }),
  meta: z
    .object({
      lifelogs: z.object({
        count: z.number(),
      }),
    })
    .optional(),
});

export type ListLifelogsResponse = z.infer<typeof ListLifelogsResponseSchema>;

/**
 * Response for getting a single lifelog
 */
export const GetLifelogResponseSchema = z.object({
  data: z.object({
    lifelog: LifelogEntrySchema,
  }),
});

export type GetLifelogResponse = z.infer<typeof GetLifelogResponseSchema>;

/**
 * Parameters for getting a specific lifelog entry
 */
export const GetLifelogParamsSchema = z.object({
  lifelog_id: z.string().min(1, "Lifelog ID is required"),
});

export type GetLifelogParams = z.infer<typeof GetLifelogParamsSchema>;

/**
 * Limitless API error response
 */
export const LimitlessErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status_code: z.number(),
});

export type LimitlessError = z.infer<typeof LimitlessErrorSchema>;

/**
 * Search parameters for lifelog entries
 */
export const SearchLifelogsParamsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  timezone: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(10).default(10),
});

export type SearchLifelogsParams = z.infer<typeof SearchLifelogsParamsSchema>;
