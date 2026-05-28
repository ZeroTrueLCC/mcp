import express, { type Request, type Response } from "express";
import type { Server } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { HttpTransportConfig, ZeroTrueMcpConfig } from "../config.js";
import { createZeroTrueMcpServer } from "../server.js";

type HealthBody = {
  ok: true;
  service: "zerotrue-mcp";
  transport: "streamable-http";
};

export async function runStreamableHttpTransport(
  config: ZeroTrueMcpConfig,
  httpConfig: HttpTransportConfig,
): Promise<void> {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "80mb" }));

  app.get("/healthz", (_req: Request, res: Response<HealthBody>) => {
    res.status(200).json({ ok: true, service: "zerotrue-mcp", transport: "streamable-http" });
  });

  app.post(httpConfig.endpoint, async (req: Request, res: Response) => {
    const server = createZeroTrueMcpServer(config);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    } as unknown as ConstructorParameters<typeof StreamableHTTPServerTransport>[0]);

    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport as Transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : "Internal MCP server error",
          },
          id: null,
        });
      }
    }
  });

  app.all(httpConfig.endpoint, (_req: Request, res: Response) => {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
  });

  const listener = await new Promise<Server>((resolve, reject) => {
    const server = app.listen(httpConfig.port, httpConfig.host, () => resolve(server));
    server.once("error", reject);
  });

  console.error(`ZeroTrue MCP listening on http://${httpConfig.host}:${httpConfig.port}${httpConfig.endpoint}`);
  await waitForShutdown(listener);
}

async function waitForShutdown(server: Server): Promise<void> {
  await new Promise<void>((resolve) => {
    const shutdown = () => {
      server.close(() => resolve());
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
}
