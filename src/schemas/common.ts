import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export const PaginationSchema = z.object({
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum results to return (1-100)"),
  offset: z.number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of results to skip for pagination")
}).strict();

export const ResponseFormatSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.JSON)
    .describe("Output format: 'json' for structured data or 'markdown' for human-readable")
}).strict();

export const VideoIdSchema = z.object({
  video_id: z.string()
    .min(1)
    .describe("Video ID (alphanumeric string)")
}).strict();

export const ChannelIdSchema = z.object({
  channel_id: z.number()
    .int()
    .positive()
    .describe("Channel ID (numeric)")
}).strict();

export const ArticleIdSchema = z.object({
  article_id: z.number()
    .int()
    .positive()
    .describe("Article ID (numeric)")
}).strict();

export const PlaylistIdSchema = z.object({
  list_id: z.string()
    .min(1)
    .describe("Playlist ID")
}).strict();

export const CommentIdSchema = z.object({
  comment_id: z.number()
    .int()
    .positive()
    .describe("Comment ID (numeric)")
}).strict();

export const CategoryIdSchema = z.object({
  category_id: z.number()
    .int()
    .positive()
    .describe("Category ID (numeric)")
}).strict();
