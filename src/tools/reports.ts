import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const ReportVideoSchema = z.object({
  video_id: z.string().min(1).describe("Video ID to report"),
  reason: z.enum([
    "spam",
    "harassment", 
    "hate_speech",
    "violence",
    "nudity",
    "copyright",
    "misinformation",
    "other"
  ]).describe("Report reason"),
  description: z.string().max(500).optional().describe("Additional details (max 500 chars)")
}).strict();

const RateVideoSchema = z.object({
  video_id: z.string().min(1).describe("Video ID"),
  rating: z.enum(["like", "dislike", "none"]).describe("Rating action")
}).strict();

export function registerReportTools(server: McpServer): void {

  server.registerTool(
    "neptime_report_video",
    {
      title: "Report Video",
      description: `Report a video for violating community guidelines. Limit: 10 reports/hour, 50/day.

Args:
  - video_id: Video ID to report (required)
  - reason: spam, harassment, hate_speech, violence, nudity, copyright, misinformation, or other (required)
  - description: Additional details, max 500 chars (optional)

Returns: Report confirmation.`,
      inputSchema: ReportVideoSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof ReportVideoSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `videos/${params.video_id}/report`,
          "POST",
          { reason: params.reason, description: params.description }
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
    "neptime_rate_video",
    {
      title: "Rate Video",
      description: `Like or dislike a video.

Args:
  - video_id: Video ID (required)
  - rating: "like", "dislike", or "none" to remove rating (required)

Returns: Updated like/dislike counts.`,
      inputSchema: RateVideoSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof RateVideoSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `videos/${params.video_id}/rate`,
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
