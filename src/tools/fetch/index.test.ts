import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { __resetObscuraCache } from "@/utils/obscura";
import { createFetchHandler } from "./index";

describe("createFetchHandler", () => {
  afterEach(() => {
    mock.restore();
    __resetObscuraCache();
  });

  it("forwards to native when source is 'native'", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("<html><body>native ok</body></html>", { status: 200 });
    });
    const handler = createFetchHandler();
    const result = await handler(
      { url: "https://example.com", type: "text", source: "native" },
      {} as never
    );
    expect(result.isError).toBeUndefined();
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
    };
    expect(p.source).toBe("native");
  });

  it("falls back to native when source is auto and no binary is available", async () => {
    mock.module("@/utils/obscura", () => ({
      getObscuraPath: () => "/tmp/nonexistent-obscura",
      checkObscura: async () => ({ available: false }),
    }));
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("<html><body>fallback</body></html>", { status: 200 });
    });
    const handler = createFetchHandler();
    const result = await handler({ url: "https://example.com", type: "text" }, {} as never);
    expect(result.isError).toBeUndefined();
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
    };
    expect(p.source).toBe("native");
  });

  it("returns error when source is 'obscura' and execAsync fails", async () => {
    mock.module("@/utils/exec", () => ({
      execAsync: async () => {
        throw new Error("Obscura not found");
      },
    }));
    const handler = createFetchHandler();
    const result = await handler(
      { url: "https://example.com", type: "text", source: "obscura" },
      {} as never
    );
    expect(result.isError).toBe(true);
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      error: string;
    };
    expect(p.error).toContain("Obscura not found");
  });

  it("returns an error object on failure", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new Error("network blew up");
    });
    const handler = createFetchHandler();
    const result = await handler(
      { url: "https://example.com", type: "text", source: "native" },
      {} as never
    );
    expect(result.isError).toBe(true);
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      error: string;
    };
    expect(p.error).toContain("network blew up");
  });
});
