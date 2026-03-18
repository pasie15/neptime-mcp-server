import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const GetPlaylistsSchema = z.object({}).strict();

const GetPlaylistSchema = z.object({
  list_id: z.string().min(1).describe("Playlist ID")
}).strict();

const CreatePlaylistSchema = z.object({
  name: z.string().min(2).max(100).describe("Playlist name"),
  description: z.string().max(500).optional().describe("Playlist description"),
  privacy: z.enum(["public", "private", "unlisted"]).default("private").describe("Privacy setting")
}).strict();

const UpdatePlaylistSchema = z.object({
  list_id: z.string().min(1).describe("Playlist ID"),
  name: z.string().min(2).max(100).optional().describe("New name"),
  description: z.string().max(500).optional().describe("New description"),
  privacy: z.enum(["public", "private", "unlisted"]).optional().describe("Privacy setting")
}).strict();

const DeletePlaylistSchema = z.object({
  list_id: z.string().min(1).describe("Playlist ID to delete")
}).strict();

const AddVideoToPlaylistSchema = z.object({
  list_id: z.string().min(1).describe("Playlist ID"),
  video_id: z.string().min(1).describe("Video ID to add")
}).strict();

const RemoveVideoFromPlaylistSchema = z.object({
  list_id: z.string().min(1).describe("Playlist ID"),
  video_id: z.string().min(1).describe("Video ID to remove")
}).strict();

export function registerPlaylistTools(server: McpServer): void {

  server.registerTool(
    "neptime_get_playlists",
    {
      title: "Get My Playlists",
      description: `Get all playlists owned by the authenticated user. Limit: 100 playlists max.

Returns: Array of playlist objects with id, name, video count, privacy.`,
      inputSchema: GetPlaylistsSchema,
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
          "playlists",
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
    "neptime_get_playlist",
    {
      title: "Get Playlist Details",
      description: `Get details of a specific playlist including videos.

Args:
  - list_id: Playlist ID (required)

Returns: Playlist object with videos array.`,
      inputSchema: GetPlaylistSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof GetPlaylistSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `playlists/${params.list_id}`,
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
    "neptime_create_playlist",
    {
      title: "Create Playlist",
      description: `Create a new playlist. Limit: 100 playlists max per user.

Args:
  - name: Playlist name, 2-100 chars (required)
  - description: Description, max 500 chars (optional)
  - privacy: public, private, or unlisted (default: private)

Returns: Created playlist object.`,
      inputSchema: CreatePlaylistSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof CreatePlaylistSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          "playlists",
          "POST",
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
    "neptime_update_playlist",
    {
      title: "Update Playlist",
      description: `Update a playlist you own.

Args:
  - list_id: Playlist ID (required)
  - name: New name, 2-100 chars (optional)
  - description: New description (optional)
  - privacy: public, private, or unlisted (optional)

Returns: Updated playlist object.`,
      inputSchema: UpdatePlaylistSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof UpdatePlaylistSchema>) => {
      try {
        const { list_id, ...updateData } = params;
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `playlists/${list_id}`,
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
    "neptime_delete_playlist",
    {
      title: "Delete Playlist",
      description: `Delete a playlist you own. This action is IRREVERSIBLE.

Args:
  - list_id: Playlist ID to delete (required)

Returns: Deletion confirmation.`,
      inputSchema: DeletePlaylistSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof DeletePlaylistSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `playlists/${params.list_id}`,
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
    "neptime_add_video_to_playlist",
    {
      title: "Add Video to Playlist",
      description: `Add a video to a playlist. Limit: 500 videos per playlist.

Args:
  - list_id: Playlist ID (required)
  - video_id: Video ID to add (required)

Returns: Confirmation with updated video count.`,
      inputSchema: AddVideoToPlaylistSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof AddVideoToPlaylistSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `playlists/${params.list_id}/videos`,
          "POST",
          { video_id: params.video_id }
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
    "neptime_remove_video_from_playlist",
    {
      title: "Remove Video from Playlist",
      description: `Remove a video from a playlist.

Args:
  - list_id: Playlist ID (required)
  - video_id: Video ID to remove (required)

Returns: Confirmation with updated video count.`,
      inputSchema: RemoveVideoFromPlaylistSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof RemoveVideoFromPlaylistSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `playlists/${params.list_id}/videos/${params.video_id}`,
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
