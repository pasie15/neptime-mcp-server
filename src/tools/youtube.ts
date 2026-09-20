import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const LookupSchema = z.object({
  type: z.enum(["search", "channel", "playlist", "videos"]).describe("YouTube lookup type"),
  q: z.string().optional().describe("Search query when type=search"),
  channel_id: z.string().optional().describe("YouTube channel ID when type=channel"),
  playlist_id: z.string().optional().describe("Playlist ID when type=playlist"),
  video_ids: z.string().optional().describe("Comma-separated YouTube video IDs when type=videos"),
  page_token: z.string().optional().describe("YouTube page token"),
  published_after: z.string().optional().describe("RFC3339 timestamp for search"),
  max_results: z.number().int().min(1).max(50).default(25).describe("Max results")
}).strict();

const ImportSchema = z.object({
  youtube_id: z.string().min(6).max(20).describe("YouTube video ID"),
  title: z.string().min(1).max(100).describe("Video title"),
  description: z.string().min(1).max(5000).describe("Video description"),
  tags: z.string().min(1).describe("Comma-separated tags"),
  category_id: z.string().optional().describe("Neptime category ID"),
  privacy: z.number().int().min(0).max(2).default(0).describe("0=public, 1=private, 2=unlisted"),
  duration: z.string().optional().describe("Duration such as 00:02:15"),
  thumbnail_url: z.string().url().optional().describe("Thumbnail URL"),
  is_short: z.boolean().default(false).describe("Mark as a Neptime short")
}).strict();

export function buildYoutubeImportForm(params: z.infer<typeof ImportSchema>): FormData {
  const form = new FormData();
  form.append("title", params.title);
  form.append("description", params.description);
  form.append("tags", params.tags);
  form.append("video-id", params.youtube_id);
  form.append("video-type", "youtube");
  form.append("privacy", String(params.privacy ?? 0));
  form.append("is_short", params.is_short ? "1" : "0");
  if (params.category_id) form.append("category_id", params.category_id);
  if (params.duration) form.append("duration", params.duration);
  if (params.thumbnail_url) form.append("thumbnail-image", params.thumbnail_url);
  return form;
}

export function registerYoutubeTools(server: McpServer): void {
  server.registerTool(
    "neptime_youtube_lookup",
    {
      title: "Look Up YouTube Metadata",
      description: `Look up YouTube channels, playlists, search results, or video details through Neptime's server-side YouTube API.

Use type=channel to get branding and the uploads playlist, type=playlist to page newest-to-oldest uploads, and type=videos to get duration for shorts detection.`,
      inputSchema: LookupSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const data = await makeApiRequest("youtube/lookup", "GET", undefined, {
          type: params.type,
          q: params.q,
          channel_id: params.channel_id,
          playlist_id: params.playlist_id,
          video_ids: params.video_ids,
          page_token: params.page_token,
          published_after: params.published_after,
          max_results: params.max_results
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data as Record<string, unknown>
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "neptime_import_youtube_video",
    {
      title: "Import YouTube Video or Short",
      description: `Repost a YouTube video onto the authenticated Neptime channel without re-uploading the file.

Set is_short=true for YouTube Shorts so Neptime files them under /shorts/. Duplicate YouTube IDs on the same channel are returned as deduped=true.`,
      inputSchema: ImportSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params) => {
      try {
        const data = await makeApiRequest(
          "videos/youtube_import",
          "POST",
          buildYoutubeImportForm(params),
          undefined,
          60000
        );
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data as Record<string, unknown>
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
