import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const GetVideoCommentsSchema = z.object({
  video_id: z.string().min(1).describe("Video ID"),
  limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
  sort: z.enum(["newest", "oldest", "top"]).default("newest").describe("Sort order")
}).strict();

const CreateVideoCommentSchema = z.object({
  video_id: z.string().min(1).describe("Video ID"),
  text: z.string().min(1).max(2000).describe("Comment text (max 2000 chars)")
}).strict();

const DeleteCommentSchema = z.object({
  comment_id: z.number().int().positive().describe("Comment ID to delete")
}).strict();

const RateCommentSchema = z.object({
  comment_id: z.number().int().positive().describe("Comment ID"),
  rating: z.enum(["like", "dislike", "none"]).describe("Rating action")
}).strict();

export function registerCommentTools(server: McpServer): void {

  server.registerTool(
    "neptime_get_video_comments",
    {
      title: "Get Video Comments",
      description: `Get comments on a video.

Args:
  - video_id: Video ID (required)
  - limit: Max results 1-100 (default: 20)
  - offset: Pagination offset (default: 0)
  - sort: Sort order - newest, oldest, top (default: newest)

Returns: Array of comments with user info, text, likes, replies.`,
      inputSchema: GetVideoCommentsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof GetVideoCommentsSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          `videos/${params.video_id}/comments`,
          "GET",
          undefined,
          { limit: params.limit, offset: params.offset, sort: params.sort }
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
    "neptime_create_video_comment",
    {
      title: "Create Video Comment",
      description: `Post a comment on a video. Limit: 50 comments/day, 10s between posts.

Args:
  - video_id: Video ID (required)
  - text: Comment text, max 2000 chars (required)

Returns: Created comment object.`,
      inputSchema: CreateVideoCommentSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof CreateVideoCommentSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `videos/${params.video_id}/comments`,
          "POST",
          { text: params.text }
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
    "neptime_delete_comment",
    {
      title: "Delete Comment",
      description: `Delete a comment you own.

Args:
  - comment_id: Comment ID to delete (required)

Returns: Deletion confirmation.`,
      inputSchema: DeleteCommentSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof DeleteCommentSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `comments/${params.comment_id}`,
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
    "neptime_rate_comment",
    {
      title: "Rate Comment",
      description: `Like or dislike a comment.

Args:
  - comment_id: Comment ID (required)
  - rating: "like", "dislike", or "none" to remove rating (required)

Returns: Updated like/dislike counts.`,
      inputSchema: RateCommentSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof RateCommentSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `comments/${params.comment_id}/rate`,
          "POST",
          { rating: params.rating }
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
