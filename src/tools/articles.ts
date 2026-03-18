import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/api.js";

const ListArticlesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset")
}).strict();

const GetArticleSchema = z.object({
  article_id: z.number().int().positive().describe("Article ID")
}).strict();

const CreateArticleSchema = z.object({
  title: z.string().min(5).max(200).describe("Article title"),
  description: z.string().min(15).max(500).describe("Short description"),
  text: z.string().min(50).describe("Article body text"),
  tags: z.string().optional().describe("Comma-separated tags"),
  category: z.number().int().optional().describe("Category ID")
}).strict();

const UpdateArticleSchema = z.object({
  article_id: z.number().int().positive().describe("Article ID"),
  title: z.string().min(5).max(200).optional().describe("New title"),
  description: z.string().min(15).max(500).optional().describe("New description"),
  text: z.string().min(50).optional().describe("New body text"),
  tags: z.string().optional().describe("New tags"),
  category: z.number().int().optional().describe("New category ID")
}).strict();

const DeleteArticleSchema = z.object({
  article_id: z.number().int().positive().describe("Article ID to delete")
}).strict();

export function registerArticleTools(server: McpServer): void {

  server.registerTool(
    "neptime_list_articles",
    {
      title: "List Articles",
      description: `List articles/posts from Neptime.io.

Args:
  - limit: Max results 1-100 (default: 20)
  - offset: Pagination offset (default: 0)

Returns: Array of article objects with id, title, description, author, date.`,
      inputSchema: ListArticlesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: z.infer<typeof ListArticlesSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown[] }>(
          "articles",
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
    "neptime_get_article",
    {
      title: "Get Article",
      description: `Get a specific article by ID.

Args:
  - article_id: Article ID (required)

Returns: Full article object with title, text, author, comments count.`,
      inputSchema: GetArticleSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof GetArticleSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `articles/${params.article_id}`,
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
    "neptime_create_article",
    {
      title: "Create Article",
      description: `Create a new article/post.

Args:
  - title: Article title, 5-200 chars (required)
  - description: Short description, 15-500 chars (required)
  - text: Article body, min 50 chars (required)
  - tags: Comma-separated tags (optional)
  - category: Category ID (optional)

Returns: Created article object.`,
      inputSchema: CreateArticleSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof CreateArticleSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          "articles",
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
    "neptime_update_article",
    {
      title: "Update Article",
      description: `Update an article you own.

Args:
  - article_id: Article ID (required)
  - title: New title (optional)
  - description: New description (optional)
  - text: New body text (optional)
  - tags: New tags (optional)
  - category: New category ID (optional)

Returns: Updated article object.`,
      inputSchema: UpdateArticleSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof UpdateArticleSchema>) => {
      try {
        const { article_id, ...updateData } = params;
        const data = await makeApiRequest<{ success: boolean; data: unknown }>(
          `articles/${article_id}`,
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
    "neptime_delete_article",
    {
      title: "Delete Article",
      description: `Delete an article you own. This action is IRREVERSIBLE.

Args:
  - article_id: Article ID to delete (required)

Returns: Deletion confirmation.`,
      inputSchema: DeleteArticleSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: z.infer<typeof DeleteArticleSchema>) => {
      try {
        const data = await makeApiRequest<{ success: boolean; message: string }>(
          `articles/${params.article_id}`,
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
