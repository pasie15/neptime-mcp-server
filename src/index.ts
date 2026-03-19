#!/usr/bin/env node
/**
 * Neptime MCP Server
 * 
 * MCP server for Neptime.io video platform API integration.
 * Provides tools for managing videos, channels, playlists, comments, and more.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setApiKey } from "./services/api.js";
import { registerVideoTools } from "./tools/videos.js";
import { registerChannelTools } from "./tools/channels.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerPlaylistTools } from "./tools/playlists.js";
import { registerArticleTools } from "./tools/articles.js";
import { registerHistoryTools } from "./tools/history.js";
import { registerCategoryTools } from "./tools/categories.js";
import { registerReportTools } from "./tools/reports.js";
import { registerUploadTools } from "./tools/uploads.js";

const server = new McpServer({
  name: "neptime-mcp-server",
  version: "1.1.1"
});

// Register all tools
registerVideoTools(server);
registerChannelTools(server);
registerCommentTools(server);
registerPlaylistTools(server);
registerArticleTools(server);
registerHistoryTools(server);
registerCategoryTools(server);
registerReportTools(server);
registerUploadTools(server);

async function main(): Promise<void> {
  const apiKey = process.env.NEPTIME_API_KEY;
  
  if (!apiKey) {
    console.error("ERROR: NEPTIME_API_KEY environment variable is required");
    console.error("Get your API key from https://neptime.io/settings/api_keys");
    process.exit(1);
  }
  
  setApiKey(apiKey);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Neptime MCP server running via stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
