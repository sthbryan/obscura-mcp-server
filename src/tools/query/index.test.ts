import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { __resetObscuraCache } from "@/utils/obscura";
import { createQueryHandler } from "./index";

describe("createQueryHandler", () => {
  afterEach(() => {
    mock.restore();
    __resetObscuraCache();
  });

  it("returns an error when neither selector nor text is provided", async () => {
    const handler = createQueryHandler();
    const result = await handler({ url: "https://example.com" }, {} as never);
    expect(result.isError).toBe(true);
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      error: string;
    };
    expect(p.error).toContain("Either");
  });

  it("delegates to native when source is 'native'", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("<html><body><h1>native yes</h1></body></html>", {
        status: 200,
      });
    });
    const handler = createQueryHandler();
    const result = await handler({ url: "https://example.com", selector: "h1" }, {} as never);
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
      result: string[];
    };
    expect(p.source).toBe("native");
    expect(p.result).toEqual(["native yes"]);
  });

  it("falls back to native when obscura binary missing", async () => {
    mock.module("@/utils/obscura", () => ({
      getObscuraPath: () => "/tmp/nonexistent-obscura",
      checkObscura: async () => ({ available: false }),
    }));
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("<html><body><h1>fallback</h1></body></html>", {
        status: 200,
      });
    });
    const handler = createQueryHandler();
    const result = await handler({ url: "https://example.com", selector: "h1" }, {} as never);
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
    };
    expect(p.source).toBe("native");
  });

  it("returns error result on thrown error", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new Error("kaboom");
    });
    const handler = createQueryHandler();
    const result = await handler({ url: "https://example.com", text: "x" }, {} as never);
    expect(result.isError).toBe(true);
  });
});
