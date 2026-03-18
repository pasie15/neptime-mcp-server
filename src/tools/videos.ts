import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";
import { ResponseFormat, CHARACTER_LIMIT } from "../constants.js";

const ListVideosSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20).describe("Max results (1-100)"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
  sort: z.enum(["newest", "oldest", "views", "likes"]).default("newest").describe("Sort order"),
  category: z.number().int().optional().describe("Filter by category ID")
}).strict();

const SearchVideosSchema = z.object({
  q: z.string().min(1).max(200).describe("Search query"),
  limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset")
}).strict();

const TrendingVideosSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
  period: z.enum(["day", "week", "month"]).default("week").describe("Trending period")
}).strict();

const GetVideoSchema = z.object({
  video_id: z.string().min(1).describe("Video ID")
}).strict();

const UpdateVideoSchema = z.object({
  video_id: z.string().min(1).describe("Video ID to update"),
  title: z.string().min(5).max(100).optional().describe("New title"),
  description: z.string().max(5000).optional().describe("New description"),
  tags: z.string().optional().describe("Comma-separated tags"),
  privacy: z.enum(["public", "private", "unlisted"]).optional().describe("Privacy setting")
}).strict();

const DeleteVideoSchema = z.object({
  video_id: z.string().min(1).describe("Video ID to delete")
}).strict();

export function registerVideoTools(server: McpServer): void {
  
  server.registerTool(
    "neptime_list_videos",
    {
      title: "List Videos",
      description: `List videos from Neptime.io with pagination and sorting.

Args:
  - limit: Max results 1-100 (default: 20)
  - offset: Pagination offset (default: 0)
  - sort: Sort order - newest, oldest, views, likes (default: newest)
  - category: Filter by category ID (optional)

Returns: Array of video objects with id, title, views, likes, duration, thumbnail, channel info.`,
      inputSchema: ListVideosSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          "videos",
          "GET",
          undefined,
          { limit: params.limit, offset: params.offset, sort: params.sort, category: params.category }
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
    "neptime_search_videos",
    {
      title: "Search Videos",
      description: `Search for videos on Neptime.io by keyword.

Args:
  - q: Search query (required, 1-200 chars)
  - limit: Max results 1-100 (default: 20)
  - offset: Pagination offset (default: 0)

Returns: Array of matching videos with relevance scoring.`,
      inputSchema: SearchVideosSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          "videos/search",
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
    "neptime_trending_videos",
    {
      title: "Get Trending Videos",
      description: `Get trending videos on Neptime.io.

Args:
  - limit: Max results 1-100 (default: 20)
  - period: Trending period - day, week, month (default: week)

Returns: Array of trending videos sorted by popularity.`,
      inputSchema: TrendingVideosSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          "videos/trending",
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
    "neptime_get_video",
    {
      title: "Get Video Details",
      description: `Get detailed information about a specific video.

Args:
  - video_id: Video ID (required)

Returns: Full video object with title, description, views, likes, comments count, channel, upload date, etc.`,
      inputSchema: GetVideoSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `videos/${params.video_id}`,
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
    "neptime_update_video",
    {
      title: "Update Video",
      description: `Update a video you own on Neptime.io.

Args:
  - video_id: Video ID to update (required)
  - title: New title (5-100 chars, optional)
  - description: New description (max 5000 chars, optional)
  - tags: Comma-separated tags (optional)
  - privacy: public, private, or unlisted (optional)

Returns: Updated video object.`,
      inputSchema: UpdateVideoSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params) => {
      try {
        const { video_id, ...updateData } = params;
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `videos/${video_id}`,
          "PUT",
          updateData
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
    "neptime_delete_video",
    {
      title: "Delete Video",
      description: `Delete a video you own on Neptime.io. This action is IRREVERSIBLE.

Args:
  - video_id: Video ID to delete (required)

Returns: Confirmation of deletion.`,
      inputSchema: DeleteVideoSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `videos/${params.video_id}`,
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
