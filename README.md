# ZeroTrue MCP Server

Official Model Context Protocol server for the [ZeroTrue AI Detection API](https://api.zerotrue.app).

Use ZeroTrue from MCP-compatible agents to analyze text, URLs, and local files for AI-generated content, deepfakes, and synthetic media.

[![npm version](https://badge.fury.io/js/%40zerotrue%2Fmcp.svg)](https://www.npmjs.com/package/@zerotrue/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Features

- Text, URL, and local file analysis
- Local `stdio` transport for desktop/CLI agents
- Streamable HTTP transport for remote deployments
- Structured JSON tool responses
- Local file upload without manual Base64 conversion
- API-key based authentication
- Works with Codex, Claude Desktop, GitHub Copilot CLI, VS Code MCP, JetBrains/IntelliJ-based clients, and other MCP clients

## Requirements

- Node.js `20.11+`
- A ZeroTrue API key from your ZeroTrue dashboard

## Quick Start

Run the server locally over `stdio`:

```bash
ZEROTRUE_API_KEY=zt_your_api_key_here npx -y @zerotrue/mcp stdio
```

Run a remote-capable Streamable HTTP server:

```bash
ZEROTRUE_API_KEY=zt_your_api_key_here npx -y @zerotrue/mcp http
```

The HTTP server listens on:

```text
http://0.0.0.0:8787/mcp
```

Health check:

```bash
curl http://127.0.0.1:8787/healthz
```

## Tools

### `zerotrue_analyze_text`

Analyze plain text.

```json
{
  "text": "Text to analyze...",
  "isPrivateScan": true,
  "isDeepScan": false
}
```

### `zerotrue_analyze_url`

Analyze content from a direct HTTP(S) URL.

```json
{
  "url": "https://example.com/image.png",
  "isPrivateScan": true,
  "isDeepScan": false
}
```

### `zerotrue_analyze_local_file`

Analyze a local file path readable by the MCP server process. This is the preferred file workflow for local MCP clients.

```json
{
  "path": "/Users/alex/Downloads/image.png",
  "isPrivateScan": true,
  "isDeepScan": false
}
```

The server checks that the file exists, is readable, is a regular non-empty file, fits within `ZEROTRUE_MAX_FILE_BYTES`, detects a MIME type from the extension, and sends multipart upload to ZeroTrue.

### `zerotrue_analyze_file`

Analyze a Base64-encoded file. Use this only when the MCP server cannot read local files directly.

```json
{
  "filename": "image.png",
  "mimeType": "image/png",
  "base64": "iVBORw0KGgo..."
}
```

### `zerotrue_get_result`

Retrieve an existing analysis result.

```json
{
  "id": "246c6522-195d-45d3-af96-0f2360d2e0bc"
}
```

### `zerotrue_get_api_info`

Return ZeroTrue public API metadata and supported formats.

```json
{}
```

## Response Shape

Successful tools return structured JSON:

```json
{
  "ok": true,
  "data": {
    "id": "246c6522-195d-45d3-af96-0f2360d2e0bc",
    "status": "completed",
    "error": null,
    "result": {
      "ai_probability": 0.998,
      "human_probability": 0.002,
      "result_type": "ai_generated",
      "feedback": "High probability of AI generation detected"
    }
  }
}
```

Errors keep the same envelope:

```json
{
  "ok": false,
  "error": {
    "statusCode": 401,
    "message": "ZeroTrue API key is required.",
    "code": "ZEROTRUE_API_ERROR"
  }
}
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `ZEROTRUE_API_KEY` | required for analysis | ZeroTrue API key, usually `zt_...` |
| `ZEROTRUE_API_BASE_URL` | `https://api.zerotrue.app` | ZeroTrue public API base URL |
| `ZEROTRUE_API_TIMEOUT_MS` | `310000` | API request timeout |
| `ZEROTRUE_MAX_FILE_BYTES` | `104857600` | Max local file size, default 100 MB |
| `ZEROTRUE_MCP_TRANSPORT` | `stdio` | `stdio` or `http` |
| `ZEROTRUE_MCP_HOST` | `0.0.0.0` | HTTP bind host |
| `ZEROTRUE_MCP_PORT` | `8787` | HTTP bind port |
| `ZEROTRUE_MCP_ENDPOINT` | `/mcp` | HTTP MCP endpoint |

## Client Setup

### Codex

Add a local MCP server that launches `@zerotrue/mcp` over `stdio`.

```toml
[mcp_servers.zerotrue]
command = "npx"
args = ["-y", "@zerotrue/mcp", "stdio"]

[mcp_servers.zerotrue.env]
ZEROTRUE_API_KEY = "zt_your_api_key_here"
ZEROTRUE_API_BASE_URL = "https://api.zerotrue.app"
```

Then ask:

```text
Check whether ./samples/image.png is AI-generated.
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zerotrue": {
      "command": "npx",
      "args": ["-y", "@zerotrue/mcp", "stdio"],
      "env": {
        "ZEROTRUE_API_KEY": "zt_your_api_key_here",
        "ZEROTRUE_API_BASE_URL": "https://api.zerotrue.app"
      }
    }
  }
}
```

### GitHub Copilot CLI

Add the server:

```bash
copilot mcp add zerotrue \
  --transport stdio \
  --env ZEROTRUE_API_KEY=zt_your_api_key_here \
  --env ZEROTRUE_API_BASE_URL=https://api.zerotrue.app \
  --tools '*' \
  --timeout 310000 \
  -- npx -y @zerotrue/mcp stdio
```

Verify:

```bash
copilot mcp list
```

### VS Code MCP

Workspace `.vscode/mcp.json`:

```json
{
  "inputs": [
    {
      "id": "zerotrue-api-key",
      "type": "promptString",
      "description": "ZeroTrue API key",
      "password": true
    }
  ],
  "servers": {
    "zerotrue": {
      "command": "npx",
      "args": ["-y", "@zerotrue/mcp", "stdio"],
      "env": {
        "ZEROTRUE_API_KEY": "${input:zerotrue-api-key}",
        "ZEROTRUE_API_BASE_URL": "https://api.zerotrue.app"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "zerotrue": {
      "command": "npx",
      "args": ["-y", "@zerotrue/mcp", "stdio"],
      "env": {
        "ZEROTRUE_API_KEY": "zt_your_api_key_here",
        "ZEROTRUE_API_BASE_URL": "https://api.zerotrue.app"
      }
    }
  }
}
```

### JetBrains / IntelliJ-based IDEs

Use the IDE MCP server settings and add a local `stdio` server:

```text
Name: zerotrue
Command: npx
Arguments: -y @zerotrue/mcp stdio
Environment:
  ZEROTRUE_API_KEY=zt_your_api_key_here
  ZEROTRUE_API_BASE_URL=https://api.zerotrue.app
```

If your JetBrains MCP integration expects JSON, use:

```json
{
  "mcpServers": {
    "zerotrue": {
      "command": "npx",
      "args": ["-y", "@zerotrue/mcp", "stdio"],
      "env": {
        "ZEROTRUE_API_KEY": "zt_your_api_key_here",
        "ZEROTRUE_API_BASE_URL": "https://api.zerotrue.app"
      }
    }
  }
}
```

### Remote Streamable HTTP

Run the server:

```bash
ZEROTRUE_API_KEY=zt_your_api_key_here \
ZEROTRUE_MCP_HOST=0.0.0.0 \
ZEROTRUE_MCP_PORT=8787 \
npx -y @zerotrue/mcp http
```

Connect MCP clients to:

```text
http://localhost:8787/mcp
```

For production, put the server behind HTTPS and normal access controls.

## Example Prompts

```text
Check whether this text was written by AI:
"..."
```

```text
Analyze https://example.com/image.png with ZeroTrue and summarize the evidence.
```

```text
Use ZeroTrue to check /Users/alex/Downloads/video.mp4. Keep the scan private.
```

```text
Retrieve ZeroTrue result 246c6522-195d-45d3-af96-0f2360d2e0bc and explain the verdict.
```

## Security Notes

- Keep `ZEROTRUE_API_KEY` out of source control.
- Prefer local `stdio` mode for personal agent clients. Your key stays in your local MCP client configuration.
- `zerotrue_analyze_local_file` can only read files accessible to the MCP server process.
- For hosted HTTP deployments, do not expose the MCP endpoint publicly without authentication and rate limiting.
- Tune `ZEROTRUE_MAX_FILE_BYTES` for your environment.

## Troubleshooting

### `ZeroTrue API key is required`

Set `ZEROTRUE_API_KEY` in the MCP server environment.

### `File is not readable or does not exist`

Use an absolute path or ensure the MCP server process has permission to read the file.

### `fetch failed`

Check connectivity:

```bash
curl https://api.zerotrue.app/api/v1/info
```

If the error includes `details.cause.code`, use it to diagnose DNS, TLS, proxy, or network failures.

### Old tool behavior after an update

Restart the MCP client. Many clients keep MCP subprocesses alive between tool calls.

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run dev:stdio
pnpm run dev:http
```

## Publishing

The package is published to npm as `@zerotrue/mcp`.

Manual release:

```bash
pnpm version patch
git push --follow-tags
```

GitHub Actions publishes tags matching:

```text
v*.*.*
```

Required repository secret:

```text
NPM_TOKEN
```

## License

MIT
