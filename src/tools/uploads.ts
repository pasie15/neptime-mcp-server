import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const UploadVideoSchema = z.object({
  title: z.string().min(1).max(100).describe("Video title"),
  description: z.string().min(1).max(5000).describe("Video description"),
  tags: z.string().min(1).describe("Comma-separated tags"),
  video_base64: z.string().optional().describe("Base64-encoded video bytes"),
  video_path: z.string().optional().describe("Local path to a video file available to the MCP server"),
  video_filename: z.string().optional().describe("Filename to use when video_base64 is provided"),
  thumbnail_base64: z.string().optional().describe("Optional base64-encoded thumbnail image bytes"),
  thumbnail_path: z.string().optional().describe("Optional local path to a thumbnail image available to the MCP server"),
  thumbnail_filename: z.string().optional().describe("Filename to use when thumbnail_base64 is provided"),
  category_id: z.number().int().positive().optional().describe("Category ID"),
  privacy: z.number().int().min(0).max(2).default(1).describe("Privacy: 0=public, 1=private, 2=unlisted"),
  age_restriction: z.number().int().min(1).max(2).default(1).describe("1=all ages, 2=18+"),
  is_short: z.boolean().default(false).describe("Whether this is a short-form video")
}).strict().refine(
  value => Boolean(value.video_base64 || value.video_path),
  { message: "Provide either video_base64 or video_path" }
);

type UploadVideoInput = z.infer<typeof UploadVideoSchema>;

function mimeTypeFor(filename: string): string {
  switch (extname(filename).toLowerCase()) {
    case ".mov": return "video/quicktime";
    case ".webm": return "video/webm";
    case ".mpeg":
    case ".mpg": return "video/mpeg";
    case ".avi": return "video/x-msvideo";
    case ".mkv": return "video/x-matroska";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".png": return "image/png";
    case ".webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

function appendFile(
  form: FormData,
  field: string,
  value: { base64?: string; path?: string; filename?: string },
): void {
  const filename = value.filename || (value.path ? basename(value.path) : `${field}.bin`);
  const bytes = value.path ? readFileSync(value.path) : Buffer.from(value.base64 || "", "base64");
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  form.append(field, new Blob([arrayBuffer], { type: mimeTypeFor(filename) }), filename);
}

export function buildVideoUploadForm(params: UploadVideoInput): FormData {
  const form = new FormData();
  form.append("title", params.title);
  form.append("description", params.description);
  form.append("tags", params.tags);
  form.append("privacy", String(params.privacy ?? 1));
  form.append("age_restriction", String(params.age_restriction ?? 1));
  form.append("is_short", params.is_short ? "1" : "0");
  if (params.category_id !== undefined) form.append("category_id", String(params.category_id));
  appendFile(form, "video", {
    base64: params.video_base64,
    path: params.video_path,
    filename: params.video_filename,
  });
  if (params.thumbnail_base64 || params.thumbnail_path) {
    appendFile(form, "thumbnail", {
      base64: params.thumbnail_base64,
      path: params.thumbnail_path,
      filename: params.thumbnail_filename,
    });
  }
  return form;
}

export function registerUploadTools(server: McpServer): void {
  server.registerTool(
    "neptime_upload_video",
    {
      title: "Upload Video",
      description: `Upload a video to Neptime.io through the live /videos/upload endpoint.

Provide either video_path for a local file available to the MCP server, or video_base64 plus video_filename.
Videos can be mp4, mov, webm, mpeg, avi, or mkv. The default privacy is private (1) for safety.

Args:
  - title: Video title (required)
  - description: Video description (required)
  - tags: Comma-separated tags (required)
  - video_path OR video_base64: Video file source (required)
  - video_filename: Filename when using video_base64
  - thumbnail_path OR thumbnail_base64: Optional thumbnail
  - category_id: Optional category ID
  - privacy: 0=public, 1=private, 2=unlisted (default: 1)
  - age_restriction: 1=all ages, 2=18+ (default: 1)
  - is_short: true for short-form video (default: false)

Returns: Uploaded video object with video_id, URL, stream URL, thumbnail, approval status, and privacy.`,
      inputSchema: UploadVideoSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: UploadVideoInput) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          "videos/upload",
          "POST",
          buildVideoUploadForm(params)
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
