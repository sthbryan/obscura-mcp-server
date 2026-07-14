import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { __resetObscuraCache } from "@/utils/obscura";
import { createSearchHandler } from "./index";

describe("createSearchHandler", () => {
  afterEach(() => {
    mock.restore();
    __resetObscuraCache();
  });

  it("delegates to native when source is 'native'", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ Results: [] }), { status: 200 });
    });
    const handler = createSearchHandler();
    const result = await handler(
      { query: "native-source-test", limit: 5, source: "native" },
      {} as never
    );
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
    };
    expect(p.source).toBe("native");
  });

  it("falls back to native when source is 'obscura' but binary missing", async () => {
    mock.module("@/utils/obscura", () => ({
      getObscuraPath: () => "/tmp/nonexistent-obscura",
      checkObscura: async () => ({ available: false }),
    }));
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(JSON.stringify({ Results: [] }), { status: 200 });
    });
    const handler = createSearchHandler();
    const result = await handler({ query: "y", limit: 5 }, {} as never);
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
    };
    expect(p.source).toBe("native");
  });

  it("returns error result on thrown error", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new Error("nope");
    });
    const handler = createSearchHandler();
    const result = await handler({ query: "z", limit: 5 }, {} as never);
    expect(result.isError).toBe(true);
  });
});
