import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const InitChunkedUploadSchema = z.object({
  filename: z.string().min(1).describe("Video filename with extension (e.g., video.mp4)"),
  filesize: z.number().int().positive().describe("Total file size in bytes"),
  chunks: z.number().int().positive().describe("Number of chunks the file will be split into")
}).strict();

const UploadChunkSchema = z.object({
  upload_id: z.string().min(1).describe("Upload session ID from init"),
  chunk: z.number().int().min(0).describe("Chunk number (0-indexed)"),
  chunk_data: z.string().describe("Base64 encoded chunk data")
}).strict();

const CompleteChunkedUploadSchema = z.object({
  upload_id: z.string().min(1).describe("Upload session ID"),
  title: z.string().min(1).max(100).describe("Video title"),
  description: z.string().max(5000).optional().describe("Video description"),
  tags: z.string().optional().describe("Comma-separated tags"),
  category_id: z.number().int().optional().describe("Category ID"),
  privacy: z.number().int().min(0).max(2).default(0).describe("Privacy: 0=public, 1=private, 2=unlisted")
}).strict();

const GetUploadStatusSchema = z.object({
  upload_id: z.string().min(1).describe("Upload session ID")
}).strict();

export function registerUploadTools(server: McpServer): void {

  server.registerTool(
    "neptime_init_chunked_upload",
    {
      title: "Initialize Chunked Upload",
      description: `Initialize a chunked video upload session for large files (up to 10GB for pro users, 1GB for free users).

This bypasses Cloudflare's 100MB upload limit by splitting files into 50MB chunks.

Args:
  - filename: Video filename with extension (required)
  - filesize: Total file size in bytes (required)
  - chunks: Number of chunks (required)

Returns: Upload session ID and chunk size info.

Workflow:
1. Call this to get upload_id
2. Upload each chunk with neptime_upload_chunk
3. Complete with neptime_complete_chunked_upload`,
      inputSchema: InitChunkedUploadSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof InitChunkedUploadSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          "videos/chunked/init",
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
    "neptime_upload_chunk",
    {
      title: "Upload Video Chunk",
      description: `Upload a single chunk of a video file.

Args:
  - upload_id: Upload session ID from init (required)
  - chunk: Chunk number, 0-indexed (required)
  - chunk_data: Base64 encoded chunk data (required)

Returns: Chunk upload confirmation with progress.

Note: Each chunk should be max 50MB. Upload chunks in order (0, 1, 2, ...).`,
      inputSchema: UploadChunkSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof UploadChunkSchema>) => {
      try {
        // Convert base64 to form data for upload
        const formData = new FormData();
        formData.append("upload_id", params.upload_id);
        formData.append("chunk", params.chunk.toString());
        
        // Decode base64 and create blob
        const binaryData = Buffer.from(params.chunk_data, "base64");
        const blob = new Blob([binaryData]);
        formData.append("chunk", blob, `chunk_${params.chunk}`);
        
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          "videos/chunked/upload",
          "POST",
          formData
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
    "neptime_complete_chunked_upload",
    {
      title: "Complete Chunked Upload",
      description: `Complete a chunked upload and create the video.

Call this after all chunks have been uploaded successfully.

Args:
  - upload_id: Upload session ID (required)
  - title: Video title (required)
  - description: Video description (optional)
  - tags: Comma-separated tags (optional)
  - category_id: Category ID (optional)
  - privacy: 0=public, 1=private, 2=unlisted (default: 0)

Returns: Created video object with ID, URL, and stream URL.`,
      inputSchema: CompleteChunkedUploadSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof CompleteChunkedUploadSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          "videos/chunked/complete",
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
    "neptime_get_upload_status",
    {
      title: "Get Upload Status",
      description: `Check the status of a chunked upload session.

Args:
  - upload_id: Upload session ID (required)

Returns: Upload progress including uploaded chunks, total chunks, and percentage.`,
      inputSchema: GetUploadStatusSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof GetUploadStatusSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          "videos/chunked/status",
          "GET",
          undefined,
          { upload_id: params.upload_id }
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
