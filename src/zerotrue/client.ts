import { describeUnknownError, ZeroTrueApiError } from "./errors.js";
import type {
  AnalyzeFileRequest,
  AnalyzePreparedFileRequest,
  AnalyzeTextRequest,
  AnalyzeUrlRequest,
  AnalysisResponse,
  ApiInfo,
  ZeroTrueErrorEnvelope,
} from "./types.js";

export type ZeroTrueClientOptions = {
  baseUrl: string;
  apiKey: string | null;
  timeoutMs: number;
  userAgent: string;
  fetchImpl?: typeof fetch;
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: BodyInit;
  headers?: HeadersInit;
  timeoutMs?: number;
};

export class ZeroTrueClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | null;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ZeroTrueClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs;
    this.userAgent = options.userAgent;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async analyzeText(request: AnalyzeTextRequest): Promise<AnalysisResponse> {
    this.requireApiKey();
    const form = new FormData();
    form.set("text", request.text);
    this.appendAnalyzeOptions(form, request);
    return this.requestJson<AnalysisResponse>("/api/v1/analyze/text", {
      method: "POST",
      body: form,
    });
  }

  async analyzeUrl(request: AnalyzeUrlRequest): Promise<AnalysisResponse> {
    this.requireApiKey();
    const form = new FormData();
    form.set("url", request.url);
    this.appendAnalyzeOptions(form, request);
    return this.requestJson<AnalysisResponse>("/api/v1/analyze/url", {
      method: "POST",
      body: form,
    });
  }

  async analyzeFile(request: AnalyzeFileRequest): Promise<AnalysisResponse> {
    this.requireApiKey();
    const bytes = this.decodeBase64(request.base64);
    return this.analyzePreparedFile({
      filename: request.filename,
      mimeType: request.mimeType ?? "application/octet-stream",
      bytes: Buffer.from(bytes),
      isDeepScan: request.isDeepScan,
      isPrivateScan: request.isPrivateScan,
    });
  }

  async analyzePreparedFile(request: AnalyzePreparedFileRequest): Promise<AnalysisResponse> {
    this.requireApiKey();
    const form = new FormData();
    form.set("file", new Blob([new Uint8Array(request.bytes)], { type: request.mimeType }), request.filename);
    this.appendAnalyzeOptions(form, request);
    return this.requestJson<AnalysisResponse>("/api/v1/analyze/file", {
      method: "POST",
      body: form,
    });
  }

  async getResult(contentId: string): Promise<AnalysisResponse> {
    const apiKey = this.requireApiKey();
    const query = new URLSearchParams({ api_key: apiKey });
    return this.requestJson<AnalysisResponse>(`/api/v1/result/${encodeURIComponent(contentId)}?${query.toString()}`);
  }

  async getInfo(): Promise<ApiInfo> {
    return this.requestJson<ApiInfo>("/api/v1/info");
  }

  private appendAnalyzeOptions(
    form: FormData,
    request: { isDeepScan?: boolean | undefined; isPrivateScan?: boolean | undefined },
  ): void {
    form.set("api_key", this.requireApiKey());
    form.set("is_deep_scan", String(request.isDeepScan ?? false));
    form.set("is_private_scan", String(request.isPrivateScan ?? true));
  }

  private async requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": this.userAgent,
      };
      if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

      const init: RequestInit = {
        method: options.method ?? "GET",
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
      };
      if (options.body !== undefined) init.body = options.body;

      const response = await this.fetchImpl(url, init);

      const body = await this.readJson(response);
      if (!response.ok) {
        throw this.errorFromResponse(response.status, body);
      }
      return body as T;
    } catch (error) {
      if (error instanceof ZeroTrueApiError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ZeroTrueApiError({
          statusCode: 408,
          message: "ZeroTrue API request timed out",
          code: "ZEROTRUE_NETWORK_ERROR",
        });
      }
      throw new ZeroTrueApiError({
        statusCode: 502,
        message: error instanceof Error ? error.message : "ZeroTrue API request failed",
        code: "ZEROTRUE_NETWORK_ERROR",
        details: describeUnknownError(error),
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      throw new ZeroTrueApiError({
        statusCode: response.ok ? 502 : response.status,
        message: "ZeroTrue API returned a non-JSON response",
        code: "ZEROTRUE_INVALID_RESPONSE",
        details: text.slice(0, 500),
      });
    }
  }

  private errorFromResponse(statusCode: number, body: unknown): ZeroTrueApiError {
    const envelope = body as Partial<ZeroTrueErrorEnvelope> | null;
    const message =
      envelope?.error && typeof envelope.error === "object" && envelope.error.message
        ? envelope.error.message
        : `ZeroTrue API returned HTTP ${statusCode}`;
    const upstreamStatus =
      envelope?.error && typeof envelope.error === "object" && typeof envelope.error.status_code === "number"
        ? envelope.error.status_code
        : statusCode;

    return new ZeroTrueApiError({
      statusCode: upstreamStatus,
      message,
      code: "ZEROTRUE_API_ERROR",
      details: body,
    });
  }

  private decodeBase64(value: string): Uint8Array {
    try {
      return Uint8Array.from(Buffer.from(value, "base64"));
    } catch {
      throw new ZeroTrueApiError({
        statusCode: 400,
        message: "Invalid base64 file payload",
        code: "ZEROTRUE_API_ERROR",
      });
    }
  }

  private requireApiKey(): string {
    if (this.apiKey) return this.apiKey;
    throw new ZeroTrueApiError({
      statusCode: 401,
      message:
        "ZeroTrue API key is required. Set ZEROTRUE_API_KEY in the shell that launches Copilot CLI, then restart or reload the MCP server.",
      code: "ZEROTRUE_API_ERROR",
    });
  }
}
