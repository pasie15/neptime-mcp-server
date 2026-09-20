import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const UpdateChannelSchema = z.object({
  first_name: z.string().optional().describe("Channel first/display name"),
  last_name: z.string().optional().describe("Channel last name"),
  about: z.string().max(5000).optional().describe("Channel description"),
  fav_category: z.string().optional().describe("Primary category ID"),
  avatar_path: z.string().optional().describe("Local avatar image path"),
  banner_path: z.string().optional().describe("Local banner image path")
}).strict();

function appendImage(form: FormData, field: string, path: string): void {
  const bytes = readFileSync(path);
  const filename = basename(path);
  const mime = extname(filename).toLowerCase() === ".png"
    ? "image/png"
    : extname(filename).toLowerCase() === ".webp"
      ? "image/webp"
      : "image/jpeg";
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  form.append(field, new Blob([arrayBuffer], { type: mime }), filename);
}

export function buildChannelUpdateForm(params: z.infer<typeof UpdateChannelSchema>): FormData {
  const form = new FormData();
  if (params.first_name) form.append("first_name", params.first_name);
  if (params.last_name) form.append("last_name", params.last_name);
  if (params.about) form.append("about", params.about);
  if (params.fav_category) form.append("fav_category", params.fav_category);
  if (params.avatar_path) appendImage(form, "avatar", params.avatar_path);
  if (params.banner_path) appendImage(form, "banner", params.banner_path);
  return form;
}

export function registerChannelProfileTools(server: McpServer): void {
  server.registerTool(
    "neptime_get_my_channel",
    {
      title: "Get My Channel",
      description: "Get the authenticated Neptime channel profile, including avatar, banner, description, and short/video counts.",
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
        const data = await makeApiRequest("channels/me", "GET");
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
    "neptime_update_my_channel",
    {
      title: "Update My Channel",
      description: "Update the authenticated Neptime channel name, about text, category, avatar, and/or banner.",
      inputSchema: UpdateChannelSchema,
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
          "channels/me",
          "POST",
          buildChannelUpdateForm(params),
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
