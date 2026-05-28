import { z } from "zod";

const analyzeOptionsShape = {
  isDeepScan: z
    .boolean()
    .optional()
    .describe("Enable deeper analysis when supported. This can consume paid credits."),
  isPrivateScan: z
    .boolean()
    .optional()
    .describe("Keep the result private. Defaults to true and can consume paid credits."),
};

export const analyzeTextShape = {
  text: z.string().min(1).max(200_000).describe("Plain text to analyze for AI-generated content."),
  ...analyzeOptionsShape,
};

export const analyzeUrlShape = {
  url: z.string().url().describe("Direct HTTP(S) URL to content that ZeroTrue should download and analyze."),
  ...analyzeOptionsShape,
};

export const analyzeFileShape = {
  filename: z.string().min(1).max(255).describe("Original filename including extension."),
  mimeType: z.string().min(1).max(120).optional().describe("MIME type, if known."),
  base64: z
    .string()
    .min(1)
    .max(70_000_000)
    .describe("Base64-encoded file bytes. Prefer zerotrue_analyze_url for large remote files."),
  ...analyzeOptionsShape,
};

export const analyzeLocalFileShape = {
  path: z
    .string()
    .min(1)
    .describe("Path to a local file readable by the MCP server process. Use zerotrue_analyze_url for remote files."),
  ...analyzeOptionsShape,
};

export const getResultShape = {
  id: z.string().uuid().describe("Analysis/result identifier returned by an analyze tool."),
};
