import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const GetCategoryVideosSchema = z.object({
  category_id: z.number().int().positive().describe("Category ID"),
  limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset")
}).strict();

export function registerCategoryTools(server: McpServer): void {

  server.registerTool(
    "neptime_get_categories",
    {
      title: "Get Categories",
      description: `Get all video categories.

Returns: Array of category objects with id, name, video count.`,
      inputSchema: z.object({}).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async () => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          "categories",
          "GET"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "neptime_get_category_videos",
    {
      title: "Get Category Videos",
      description: `Get videos in a specific category.

Args:
  - category_id: Category ID (required)
  - limit: Max results 1-100 (default: 20)
  - offset: Pagination offset (default: 0)

Returns: Array of videos in the category.`,
      inputSchema: GetCategoryVideosSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof GetCategoryVideosSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          `categories/${params.category_id}/videos`,
          "GET",
          undefined,
          { limit: params.limit, offset: params.offset }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
