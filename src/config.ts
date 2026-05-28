export type TransportKind = "stdio" | "http";

export type ZeroTrueMcpConfig = {
  apiBaseUrl: string;
  apiKey: string | null;
  requestTimeoutMs: number;
  maxFileBytes: number;
  userAgent: string;
};

export type HttpTransportConfig = {
  host: string;
  port: number;
  endpoint: string;
};

function readString(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

function readInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer, got "${raw}"`);
  }
  return value;
}

function normalizeBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid ZEROTRUE_API_BASE_URL: "${value}"`);
  }
}

export function readMcpConfig(): ZeroTrueMcpConfig {
  return {
    apiBaseUrl: normalizeBaseUrl(readString("ZEROTRUE_API_BASE_URL", "https://api.zerotrue.app")),
    apiKey: process.env.ZEROTRUE_API_KEY?.trim() || null,
    requestTimeoutMs: readInteger("ZEROTRUE_API_TIMEOUT_MS", 310_000),
    maxFileBytes: readInteger("ZEROTRUE_MAX_FILE_BYTES", 100 * 1024 * 1024),
    userAgent: readString("ZEROTRUE_MCP_USER_AGENT", "@zerotrue/mcp/0.1.0"),
  };
}

export function readTransportKind(argv = process.argv): TransportKind {
  const explicit = argv[2] ?? process.env.ZEROTRUE_MCP_TRANSPORT ?? "stdio";
  if (explicit === "stdio" || explicit === "http") return explicit;
  throw new Error(`Unknown transport "${explicit}". Expected "stdio" or "http".`);
}

export function readHttpTransportConfig(): HttpTransportConfig {
  return {
    host: readString("ZEROTRUE_MCP_HOST", "0.0.0.0"),
    port: readInteger("ZEROTRUE_MCP_PORT", 8787),
    endpoint: readString("ZEROTRUE_MCP_ENDPOINT", "/mcp"),
  };
}
