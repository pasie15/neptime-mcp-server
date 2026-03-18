import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const GetChannelSchema = z.object({
  channel_id: z.number().int().positive().describe("Channel ID")
}).strict();

const GetChannelVideosSchema = z.object({
  channel_id: z.number().int().positive().describe("Channel ID"),
  limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset")
}).strict();

const SubscribeSchema = z.object({
  channel_id: z.number().int().positive().describe("Channel ID to subscribe to")
}).strict();

export function registerChannelTools(server: McpServer): void {

  server.registerTool(
    "neptime_get_channel",
    {
      title: "Get Channel",
      description: `Get channel information by ID.

Args:
  - channel_id: Channel ID (required)

Returns: Channel object with name, avatar, subscriber count, video count, description.`,
      inputSchema: GetChannelSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof GetChannelSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `channels/${params.channel_id}`,
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
    "neptime_get_channel_videos",
    {
      title: "Get Channel Videos",
      description: `Get videos from a specific channel.

Args:
  - channel_id: Channel ID (required)
  - limit: Max results 1-100 (default: 20)
  - offset: Pagination offset (default: 0)

Returns: Array of videos from the channel.`,
      inputSchema: GetChannelVideosSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof GetChannelVideosSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          `channels/${params.channel_id}/videos`,
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

  server.registerTool(
    "neptime_subscribe",
    {
      title: "Subscribe to Channel",
      description: `Subscribe to a channel. Limit: 50 subscriptions per day.

Args:
  - channel_id: Channel ID to subscribe to (required)

Returns: Subscription confirmation.`,
      inputSchema: SubscribeSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof SubscribeSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `channels/${params.channel_id}/subscribe`,
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
    "neptime_unsubscribe",
    {
      title: "Unsubscribe from Channel",
      description: `Unsubscribe from a channel.

Args:
  - channel_id: Channel ID to unsubscribe from (required)

Returns: Unsubscription confirmation.`,
      inputSchema: SubscribeSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof SubscribeSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `channels/${params.channel_id}/subscribe`,
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
    "neptime_get_subscriptions",
    {
      title: "Get My Subscriptions",
      description: `Get list of channels you are subscribed to.

Args:
  - limit: Max results 1-100 (default: 20)
  - offset: Pagination offset (default: 0)

Returns: Array of subscribed channels.`,
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
        offset: z.number().int().min(0).default(0).describe("Pagination offset")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: { limit: number; offset: number }) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          "subscriptions",
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
}
