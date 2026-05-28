import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { normalizeUnknownError } from "../zerotrue/errors.js";

export type ToolSuccess<T> = {
  ok: true;
  data: T;
};

export type ToolFailure = {
  ok: false;
  error: ReturnType<typeof normalizeUnknownError>;
};

export type ToolEnvelope<T> = ToolSuccess<T> | ToolFailure;

export function toolSuccess<T>(data: T): CallToolResult {
  const envelope: ToolSuccess<T> = { ok: true, data };
  return jsonToolResult(envelope);
}

export function toolFailure(error: unknown): CallToolResult {
  const envelope: ToolFailure = { ok: false, error: normalizeUnknownError(error) };
  return {
    ...jsonToolResult(envelope),
    isError: true,
  };
}

function jsonToolResult(value: ToolEnvelope<unknown>): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
    structuredContent: value,
  };
}
