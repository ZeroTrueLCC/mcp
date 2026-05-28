import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ZeroTrueApiError } from "../src/zerotrue/errors.js";
import { prepareLocalFile } from "../src/zerotrue/local-file.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "zerotrue-mcp-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("prepareLocalFile", () => {
  it("reads a regular file and detects MIME type from extension", async () => {
    const filePath = path.join(tempDir, "image.png");
    await writeFile(filePath, Buffer.from([1, 2, 3]));

    const file = await prepareLocalFile(filePath, 1024);

    expect(file.filename).toBe("image.png");
    expect(file.mimeType).toBe("image/png");
    expect(file.sizeBytes).toBe(3);
    expect(file.bytes).toEqual(Buffer.from([1, 2, 3]));
    expect(file.path).toBe(path.resolve(filePath));
  });

  it("rejects directories", async () => {
    await expect(prepareLocalFile(tempDir, 1024)).rejects.toMatchObject({
      statusCode: 400,
      code: "ZEROTRUE_API_ERROR",
    } satisfies Partial<ZeroTrueApiError>);
  });

  it("rejects files over the configured size limit", async () => {
    const filePath = path.join(tempDir, "large.txt");
    await writeFile(filePath, "12345");

    await expect(prepareLocalFile(filePath, 4)).rejects.toMatchObject({
      statusCode: 413,
      code: "ZEROTRUE_API_ERROR",
    } satisfies Partial<ZeroTrueApiError>);
  });
});
