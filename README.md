# ZeroTrue MCP Server

[![npm version](https://img.shields.io/npm/v/%40zerotrue%2Fmcp?style=flat-square)](https://www.npmjs.com/package/@zerotrue/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.11-brightgreen?style=flat-square)](https://nodejs.org)

Official [Model Context Protocol](https://modelcontextprotocol.io) server for the [ZeroTrue AI Detection API](https://zerotrue.app). Detect AI-generated text, images, video, and audio from any MCP-compatible agent or IDE.

## Quick Start

> Requires a ZeroTrue API key. Get one at [zerotrue.app](https://zerotrue.app).

```bash
ZEROTRUE_API_KEY=zt_your_key npx -y @zerotrue/mcp stdio
```

## Tools

| Tool | Description |
| --- | --- |
| `zerotrue_analyze_text` | Detect AI-generated content in plain text |
| `zerotrue_analyze_url` | Analyze media or text at a direct HTTP(S) URL |
| `zerotrue_analyze_local_file` | Analyze a local file by path (preferred for desktop/CLI clients) |
| `zerotrue_analyze_file` | Analyze a Base64-encoded file |
| `zerotrue_get_result` | Retrieve a previous analysis result by ID |
| `zerotrue_get_api_info` | Return API metadata and supported formats |

All tools accept optional `isDeepScan` and `isPrivateScan` flags where applicable.

### `zerotrue_analyze_local_file`

The recommended tool for local MCP clients. Pass an absolute path: the server validates the file, detects its MIME type, and uploads it as a multipart form to ZeroTrue. No manual Base64 encoding needed.

```json
{ "path": "/Users/alex/Downloads/photo.png", "isPrivateScan": true }
```

### `zerotrue_analyze_text`

```json
{ "text": "Paste the content here...", "isDeepScan": false }
```

### `zerotrue_analyze_url`

```json
{ "url": "https://example.com/video.mp4", "isPrivateScan": true }
```

### `zerotrue_get_result`

```json
{ "id": "246c6522-195d-45d3-af96-0f2360d2e0bc" }
```

---

## Response Format

Every tool returns a consistent JSON envelope:

```json
{
  "ok": true,
  "data": {
    "id": "246c6522-195d-45d3-af96-0f2360d2e0bc",
    "status": "completed",
    "result": {
      "ai_probability": 0.998,
      "human_probability": 0.002,
      "result_type": "ai_generated",
      "feedback": "High probability of AI generation detected"
    }
  }
}
```

Errors use the same shape with `ok: false`:

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

---

## Client Setup

<details>
<summary><strong>Codex</strong></summary>

```toml
[mcp_servers.zerotrue]
command = "npx"
args = ["-y", "@zerotrue/mcp", "stdio"]

[mcp_servers.zerotrue.env]
ZEROTRUE_API_KEY = "zt_your_key"
```

</details>

<details>
<summary><strong>Claude Desktop / Claude Code</strong></summary>

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zerotrue": {
      "command": "npx",
      "args": ["-y", "@zerotrue/mcp", "stdio"],
      "env": {
        "ZEROTRUE_API_KEY": "zt_your_key"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>GitHub Copilot CLI</strong></summary>

```bash
copilot mcp add zerotrue \
  --transport stdio \
  --env ZEROTRUE_API_KEY=zt_your_key \
  --tools '*' \
  --timeout 310000 \
  -- npx -y @zerotrue/mcp stdio
```

</details>

<details>
<summary><strong>VS Code</strong></summary>

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=zerotrue&inputs=%5B%7B%22id%22%3A%22zerotrue_api_key%22%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22ZeroTrue%20API%20key%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40zerotrue%2Fmcp%22%2C%22stdio%22%5D%2C%22env%22%3A%7B%22ZEROTRUE_API_KEY%22%3A%22%24%7Binput%3Azerotrue_api_key%7D%22%7D%7D)
[![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Server-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=zerotrue&inputs=%5B%7B%22id%22%3A%22zerotrue_api_key%22%2C%22type%22%3A%22promptString%22%2C%22description%22%3A%22ZeroTrue%20API%20key%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40zerotrue%2Fmcp%22%2C%22stdio%22%5D%2C%22env%22%3A%7B%22ZEROTRUE_API_KEY%22%3A%22%24%7Binput%3Azerotrue_api_key%7D%22%7D%7D&quality=insiders)

Or add manually to your workspace `.vscode/mcp.json`:

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
        "ZEROTRUE_API_KEY": "${input:zerotrue-api-key}"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "zerotrue": {
      "command": "npx",
      "args": ["-y", "@zerotrue/mcp", "stdio"],
      "env": {
        "ZEROTRUE_API_KEY": "zt_your_key"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>JetBrains / IntelliJ</strong></summary>

Use the IDE MCP settings panel with a local `stdio` server:

```json
{
  "mcpServers": {
    "zerotrue": {
      "command": "npx",
      "args": ["-y", "@zerotrue/mcp", "stdio"],
      "env": {
        "ZEROTRUE_API_KEY": "zt_your_key"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Remote / self-hosted (Streamable HTTP)</strong></summary>

Run the HTTP server:

```bash
ZEROTRUE_API_KEY=zt_your_key \
ZEROTRUE_MCP_PORT=8787 \
npx -y @zerotrue/mcp http
```

Or with Docker:

```bash
docker run -p 8787:8787 \
  -e ZEROTRUE_API_KEY=zt_your_key \
  zerotrue/mcp
```

MCP endpoint: `http://localhost:8787/mcp`
Health check: `http://localhost:8787/healthz`

Point your MCP client to the endpoint above. For production, place the server behind HTTPS and add authentication.

</details>

---

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `ZEROTRUE_API_KEY` | (required) | ZeroTrue API key (`zt_...`). Required for all analysis tools. |
| `ZEROTRUE_API_BASE_URL` | `https://api.zerotrue.app` | ZeroTrue API base URL |
| `ZEROTRUE_API_TIMEOUT_MS` | `310000` | Request timeout in milliseconds |
| `ZEROTRUE_MAX_FILE_BYTES` | `104857600` | Max local file size (default 100 MB) |
| `ZEROTRUE_MCP_TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `ZEROTRUE_MCP_HOST` | `0.0.0.0` | HTTP bind host |
| `ZEROTRUE_MCP_PORT` | `8787` | HTTP bind port |
| `ZEROTRUE_MCP_ENDPOINT` | `/mcp` | HTTP MCP path |

---

## Example Prompts

```
Is this text AI-generated? "The quantum entanglement of..."
```

```
Analyze https://example.com/profile.jpg with ZeroTrue and summarize the result.
```

```
Use ZeroTrue to check /Downloads/video.mp4. Keep the scan private.
```

```
Get ZeroTrue result 246c6522-195d-45d3-af96-0f2360d2e0bc and explain the verdict.
```

---

## Security

- Store `ZEROTRUE_API_KEY` in your MCP client config, never in source control.
- Prefer `stdio` mode for personal use: your key never leaves your machine.
- `zerotrue_analyze_local_file` can only access files readable by the MCP server process.
- For HTTP deployments, do not expose the `/mcp` endpoint publicly without authentication and rate limiting.

---

## Troubleshooting

**`ZeroTrue API key is required`** - Set `ZEROTRUE_API_KEY` in the environment where the MCP server starts.

**`File is not readable or does not exist`** - Use an absolute path and confirm the MCP server process has read access.

**`fetch failed`** - Check connectivity: `curl https://api.zerotrue.app/api/v1/info`. If `details.cause.code` is present, use it to diagnose DNS, TLS, or proxy issues.

**Stale tool behavior after an update** - Restart the MCP client. Most clients keep MCP subprocesses alive between tool calls.

---

## Requirements

- Node.js `>= 20.11`

---

## License

[MIT](./LICENSE)
