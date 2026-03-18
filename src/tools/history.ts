import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const GetHistorySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset")
}).strict();

const WatchLaterSchema = z.object({
  video_id: z.string().min(1).describe("Video ID")
}).strict();

export function registerHistoryTools(server: McpServer): void {

  server.registerTool(
    "neptime_get_history",
    {
      title: "Get Watch History",
      description: `Get your video watch history.

Args:
  - limit: Max results 1-100 (default: 20)
  - offset: Pagination offset (default: 0)

Returns: Array of watched videos with timestamps.`,
      inputSchema: GetHistorySchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof GetHistorySchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          "history",
          "GET",
          undefined,
          params
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
    "neptime_clear_history",
    {
      title: "Clear Watch History",
      description: `Clear all watch history. This action is IRREVERSIBLE.

Returns: Confirmation of history cleared.`,
      inputSchema: z.object({}).strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          "history",
          "DELETE"
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
    "neptime_get_watch_later",
    {
      title: "Get Watch Later List",
      description: `Get your watch later list.

Returns: Array of videos saved for later.`,
      inputSchema: z.object({}).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          "watch-later",
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
    "neptime_add_watch_later",
    {
      title: "Add to Watch Later",
      description: `Add a video to your watch later list.

Args:
  - video_id: Video ID to add (required)

Returns: Confirmation.`,
      inputSchema: WatchLaterSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof WatchLaterSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `videos/${params.video_id}/watch-later`,
          "POST"
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
    "neptime_remove_watch_later",
    {
      title: "Remove from Watch Later",
      description: `Remove a video from your watch later list.

Args:
  - video_id: Video ID to remove (required)

Returns: Confirmation.`,
      inputSchema: WatchLaterSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof WatchLaterSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `videos/${params.video_id}/watch-later`,
          "DELETE"
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
