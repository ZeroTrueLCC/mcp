#!/usr/bin/env node
import { readHttpTransportConfig, readMcpConfig, readTransportKind } from "./config.js";
import { runStdioTransport } from "./transports/stdio.js";
import { runStreamableHttpTransport } from "./transports/streamable-http.js";

async function main(): Promise<void> {
  const transport = readTransportKind();
  const config = readMcpConfig();

  if (transport === "stdio") {
    await runStdioTransport(config);
    return;
  }

  await runStreamableHttpTransport(config, readHttpTransportConfig());
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
