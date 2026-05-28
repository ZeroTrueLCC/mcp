export type ZeroTrueErrorPayload = {
  statusCode: number;
  message: string;
  code: "ZEROTRUE_API_ERROR" | "ZEROTRUE_NETWORK_ERROR" | "ZEROTRUE_INVALID_RESPONSE";
  details?: unknown;
};

export class ZeroTrueApiError extends Error {
  readonly statusCode: number;
  readonly code: ZeroTrueErrorPayload["code"];
  readonly details?: unknown;

  constructor(payload: ZeroTrueErrorPayload) {
    super(payload.message);
    this.name = "ZeroTrueApiError";
    this.statusCode = payload.statusCode;
    this.code = payload.code;
    this.details = payload.details;
  }

  toJSON(): ZeroTrueErrorPayload {
    const payload: ZeroTrueErrorPayload = {
      statusCode: this.statusCode,
      message: this.message,
      code: this.code,
    };
    if (this.details !== undefined) payload.details = this.details;
    return payload;
  }
}

export function normalizeUnknownError(error: unknown): ZeroTrueErrorPayload {
  if (error instanceof ZeroTrueApiError) return error.toJSON();
  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: error.message || "Unexpected MCP server error",
      code: "ZEROTRUE_NETWORK_ERROR",
    };
  }
  return {
    statusCode: 500,
    message: "Unexpected MCP server error",
    code: "ZEROTRUE_NETWORK_ERROR",
    details: error,
  };
}

export function describeUnknownError(error: unknown): Record<string, unknown> | undefined {
  if (!(error instanceof Error)) return undefined;

  const details: Record<string, unknown> = {
    name: error.name,
  };

  const cause = "cause" in error ? (error as Error & { cause?: unknown }).cause : undefined;
  if (cause instanceof Error) {
    details.cause = {
      name: cause.name,
      message: cause.message,
      ...pickErrorFields(cause),
    };
  } else if (cause && typeof cause === "object") {
    details.cause = pickErrorFields(cause);
  }

  return Object.keys(details).length > 1 ? details : undefined;
}

function pickErrorFields(value: object): Record<string, unknown> {
  const source = value as Record<string, unknown>;
  const fields: Record<string, unknown> = {};

  for (const key of ["code", "errno", "syscall", "hostname", "host", "port", "address"]) {
    if (source[key] !== undefined) fields[key] = source[key];
  }

  return fields;
}
