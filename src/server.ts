import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZeroTrueMcpConfig } from "./config.js";
import { toolFailure, toolSuccess } from "./tools/result.js";
import {
  analyzeFileShape,
  analyzeLocalFileShape,
  analyzeTextShape,
  analyzeUrlShape,
  getResultShape,
} from "./tools/schemas.js";
import { ZeroTrueClient } from "./zerotrue/client.js";
import { prepareLocalFile } from "./zerotrue/local-file.js";

export function createZeroTrueMcpServer(config: ZeroTrueMcpConfig): McpServer {
  const server = new McpServer({
    name: "zerotrue",
    version: "0.1.0",
  });

  const client = new ZeroTrueClient({
    baseUrl: config.apiBaseUrl,
    apiKey: config.apiKey,
    timeoutMs: config.requestTimeoutMs,
    userAgent: config.userAgent,
  });

  server.registerTool(
    "zerotrue_analyze_text",
    {
      title: "Analyze Text",
      description: "Analyze plain text for AI-generated content using ZeroTrue.",
      inputSchema: analyzeTextShape,
    },
    async (input) => {
      try {
        return toolSuccess(await client.analyzeText(input));
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  server.registerTool(
    "zerotrue_analyze_url",
    {
      title: "Analyze URL",
      description: "Analyze content at a direct HTTP(S) URL using ZeroTrue.",
      inputSchema: analyzeUrlShape,
    },
    async (input) => {
      try {
        return toolSuccess(await client.analyzeUrl(input));
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  server.registerTool(
    "zerotrue_analyze_local_file",
    {
      title: "Analyze Local File",
      description: "Analyze a local file path readable by the MCP server. Best option for local desktop/CLI MCP clients.",
      inputSchema: analyzeLocalFileShape,
    },
    async (input) => {
      try {
        const file = await prepareLocalFile(input.path, config.maxFileBytes);
        const result = await client.analyzePreparedFile({
          filename: file.filename,
          mimeType: file.mimeType,
          bytes: file.bytes,
          isDeepScan: input.isDeepScan,
          isPrivateScan: input.isPrivateScan,
        });
        return toolSuccess({
          ...result,
          source_file: {
            path: file.path,
            filename: file.filename,
            mime_type: file.mimeType,
            size_bytes: file.sizeBytes,
          },
        });
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  server.registerTool(
    "zerotrue_analyze_file",
    {
      title: "Analyze File",
      description:
        "Analyze a base64-encoded file using ZeroTrue. Prefer zerotrue_analyze_local_file for local files and zerotrue_analyze_url for remote files.",
      inputSchema: analyzeFileShape,
    },
    async (input) => {
      try {
        return toolSuccess(await client.analyzeFile(input));
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  server.registerTool(
    "zerotrue_get_result",
    {
      title: "Get Analysis Result",
      description: "Retrieve a ZeroTrue analysis result by ID.",
      inputSchema: getResultShape,
    },
    async ({ id }) => {
      try {
        return toolSuccess(await client.getResult(id));
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  server.registerTool(
    "zerotrue_get_api_info",
    {
      title: "Get API Info",
      description: "Return ZeroTrue public API metadata and supported formats.",
      inputSchema: {},
    },
    async () => {
      try {
        return toolSuccess(await client.getInfo());
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  return server;
}
