import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZeroTrueMcpConfig } from "../config.js";
import { createZeroTrueMcpServer } from "../server.js";

export async function runStdioTransport(config: ZeroTrueMcpConfig): Promise<void> {
  const server = createZeroTrueMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
