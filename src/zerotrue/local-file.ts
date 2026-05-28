import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { ZeroTrueApiError } from "./errors.js";

export type PreparedLocalFile = {
  filename: string;
  mimeType: string;
  bytes: Buffer;
  sizeBytes: number;
  path: string;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".py": "text/x-python",
  ".js": "text/javascript",
  ".ts": "text/typescript",
  ".html": "text/html",
  ".css": "text/css",
  ".java": "text/x-java-source",
  ".cpp": "text/x-c++src",
  ".cc": "text/x-c++src",
  ".cxx": "text/x-c++src",
  ".go": "text/x-go",
  ".json": "application/json",
  ".txt": "text/plain",
};

export async function prepareLocalFile(filePath: string, maxFileBytes: number): Promise<PreparedLocalFile> {
  const resolvedPath = path.resolve(filePath);

  try {
    await access(resolvedPath, constants.R_OK);
  } catch {
    throw new ZeroTrueApiError({
      statusCode: 404,
      message: `File is not readable or does not exist: ${resolvedPath}`,
      code: "ZEROTRUE_API_ERROR",
    });
  }

  const info = await stat(resolvedPath);
  if (!info.isFile()) {
    throw new ZeroTrueApiError({
      statusCode: 400,
      message: `Path must point to a regular file: ${resolvedPath}`,
      code: "ZEROTRUE_API_ERROR",
    });
  }

  if (info.size <= 0) {
    throw new ZeroTrueApiError({
      statusCode: 400,
      message: `File is empty: ${resolvedPath}`,
      code: "ZEROTRUE_API_ERROR",
    });
  }

  if (info.size > maxFileBytes) {
    throw new ZeroTrueApiError({
      statusCode: 413,
      message: `File is too large: ${info.size} bytes. Maximum allowed by this MCP server is ${maxFileBytes} bytes.`,
      code: "ZEROTRUE_API_ERROR",
      details: { sizeBytes: info.size, maxFileBytes },
    });
  }

  const bytes = await readFile(resolvedPath);
  const extension = path.extname(resolvedPath).toLowerCase();

  return {
    filename: path.basename(resolvedPath),
    mimeType: MIME_BY_EXTENSION[extension] ?? "application/octet-stream",
    bytes,
    sizeBytes: info.size,
    path: resolvedPath,
  };
}
