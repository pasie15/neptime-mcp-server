# Neptime MCP Server

MCP (Model Context Protocol) server for [Neptime.io](https://neptime.io) video platform API integration.

## Features

This MCP server provides 40+ tools for interacting with the Neptime.io API:

### Videos
- List, search, and get trending videos
- Get video details
- Update and delete your videos
- Rate videos (like/dislike)

### Video Uploads (NEW in v1.1.0)
- Chunked upload for large files (up to 10GB for pro users, 1GB for free)
- Bypasses Cloudflare's 100MB limit with 50MB chunks
- Upload progress tracking

### Channels
- Get channel information
- Get channel videos
- Subscribe/unsubscribe from channels
- View your subscriptions

### Playlists
- Create, update, and delete playlists
- Add/remove videos from playlists
- View playlist details

### Comments
- Get video comments
- Post comments on videos
- Delete your comments
- Rate comments

### Articles
- List and get articles
- Create, update, and delete articles

### History & Watch Later
- View watch history
- Clear watch history
- Manage watch later list

### Categories
- Get all categories
- Get videos by category

### Reports
- Report videos for violations

## Installation

```bash
npm install -g neptime-mcp-server
```

Or run directly with npx:

```bash
npx neptime-mcp-server
```

## Configuration

### Get Your API Key

1. Go to [https://neptime.io/settings/api_keys](https://neptime.io/settings/api_keys)
2. Create a new API key with the required scopes
3. Copy the API key

### Environment Variable

Set the `NEPTIME_API_KEY` environment variable:

```bash
export NEPTIME_API_KEY="your-api-key-here"
```

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "neptime": {
      "command": "npx",
      "args": ["neptime-mcp-server"],
      "env": {
        "NEPTIME_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "neptime": {
      "command": "neptime-mcp-server",
      "env": {
        "NEPTIME_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `neptime_list_videos` | List videos with pagination and sorting |
| `neptime_search_videos` | Search for videos by keyword |
| `neptime_trending_videos` | Get trending videos |
| `neptime_get_video` | Get video details |
| `neptime_update_video` | Update a video you own |
| `neptime_delete_video` | Delete a video you own |
| `neptime_rate_video` | Like or dislike a video |
| `neptime_get_channel` | Get channel information |
| `neptime_get_channel_videos` | Get videos from a channel |
| `neptime_subscribe` | Subscribe to a channel |
| `neptime_unsubscribe` | Unsubscribe from a channel |
| `neptime_get_subscriptions` | Get your subscriptions |
| `neptime_get_playlists` | Get your playlists |
| `neptime_get_playlist` | Get playlist details |
| `neptime_create_playlist` | Create a new playlist |
| `neptime_update_playlist` | Update a playlist |
| `neptime_delete_playlist` | Delete a playlist |
| `neptime_add_video_to_playlist` | Add video to playlist |
| `neptime_remove_video_from_playlist` | Remove video from playlist |
| `neptime_get_video_comments` | Get comments on a video |
| `neptime_create_video_comment` | Post a comment |
| `neptime_delete_comment` | Delete your comment |
| `neptime_rate_comment` | Like or dislike a comment |
| `neptime_list_articles` | List articles |
| `neptime_get_article` | Get article details |
| `neptime_create_article` | Create an article |
| `neptime_update_article` | Update an article |
| `neptime_delete_article` | Delete an article |
| `neptime_get_history` | Get watch history |
| `neptime_clear_history` | Clear watch history |
| `neptime_get_watch_later` | Get watch later list |
| `neptime_add_watch_later` | Add to watch later |
| `neptime_remove_watch_later` | Remove from watch later |
| `neptime_get_categories` | Get all categories |
| `neptime_get_category_videos` | Get videos in a category |
| `neptime_report_video` | Report a video |
| `neptime_init_chunked_upload` | Initialize chunked upload session |
| `neptime_upload_chunk` | Upload a video chunk |
| `neptime_complete_chunked_upload` | Complete upload and create video |
| `neptime_get_upload_status` | Check upload progress |

## Rate Limits

The Neptime API has the following rate limits:
- **Global**: 1000 requests/hour, 60 requests/minute
- **Comments**: 50/day, 10 seconds between posts
- **Subscriptions**: 50/day
- **Reports**: 10/hour, 50/day
- **Playlists**: 100 max per user, 500 videos per playlist

## Development

```bash
# Clone the repository
git clone https://github.com/niceptime/neptime-mcp-server.git
cd neptime-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev
```

## License

MIT
