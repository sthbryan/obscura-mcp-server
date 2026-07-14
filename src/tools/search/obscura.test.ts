import { afterEach, describe, expect, it, mock } from "bun:test";
import { extractRealUrl, parseLinks, searchWithObscura } from "./obscura";

const SEARCH_URL = "https://duckduckgo.com/html/?q=typescript";

describe("extractRealUrl", () => {
  it("decodes DuckDuckGo uddg redirect", () => {
    const raw = "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F&test=1";
    expect(extractRealUrl(raw)).toBe("https://example.com/");
  });

  it("passes through plain URLs unchanged", () => {
    expect(extractRealUrl("https://example.com/path")).toBe("https://example.com/path");
  });

  it("falls back to original URL if decoding fails", () => {
    const raw = "https://duckduckgo.com/l/?uddg=%E0%A4%A";
    expect(extractRealUrl(raw)).toBe(raw);
  });
});

describe("parseLinks", () => {
  it("extracts url/title pairs separated by tabs", () => {
    const raw = [
      "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fa.com%2F\tA Site",
      "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fb.com%2F\tB Site",
    ].join("\n");
    const results = parseLinks(raw, SEARCH_URL, 10);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ title: "A Site", url: "https://a.com/" });
    expect(results[1]).toEqual({ title: "B Site", url: "https://b.com/" });
  });

  it("respects the limit", () => {
    const raw = [
      "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fa.com%2F\tA",
      "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fb.com%2F\tB",
      "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fc.com%2F\tC",
    ].join("\n");
    const results = parseLinks(raw, SEARCH_URL, 2);
    expect(results).toHaveLength(2);
  });

  it("deduplicates URLs", () => {
    const raw = [
      "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fa.com%2F\tA",
      "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fa.com%2F\tA again",
    ].join("\n");
    const results = parseLinks(raw, SEARCH_URL, 10);
    expect(results).toHaveLength(1);
  });

  it("ignores lines without a tab separator", () => {
    const raw = "just a line without tab\nhttps://example.com\tTitle";
    const results = parseLinks(raw, SEARCH_URL, 10);
    expect(results).toHaveLength(1);
    expect(results[0]?.url).toBe("https://example.com");
  });

  it("skips non-http URLs", () => {
    const raw = "ftp://example.com\tFTP\nhttps://example.com\tHTTP";
    const results = parseLinks(raw, SEARCH_URL, 10);
    expect(results).toHaveLength(1);
    expect(results[0]?.url).toBe("https://example.com");
  });
});

describe("searchWithObscura", () => {
  afterEach(() => {
    mock.restore();
  });

  it("calls execAsync with stealth + links dump and returns parsed results", async () => {
    mock.module("@/utils/obscura", () => ({
      getObscuraPath: () => "/bin/echo",
      checkObscura: async () => ({ available: true }),
    }));
    mock.module("@/utils/exec", () => ({
      execAsync: async () =>
        [
          "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fa.com%2F\tSite A",
          "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fb.com%2F\tSite B",
        ].join("\n"),
    }));

    const result = await searchWithObscura("test query", 5);
    expect(result.isError).toBeUndefined();
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      query: string;
      source: string;
      results: Array<{ title: string; url: string }>;
    };
    expect(p.source).toBe("obscura");
    expect(p.query).toBe("test query");
    expect(p.results).toHaveLength(2);
    expect(p.results[0]?.url).toBe("https://a.com/");
  });

  it("returns an empty results list when exec output has no parsable links", async () => {
    mock.module("@/utils/obscura", () => ({
      getObscuraPath: () => "/bin/echo",
      checkObscura: async () => ({ available: true }),
    }));
    mock.module("@/utils/exec", () => ({
      execAsync: async () => "no tab-separated lines here\njust plain text",
    }));

    const result = await searchWithObscura("weird", 5);
    expect(result.isError).toBeUndefined();
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      results: unknown[];
    };
    expect(p.results).toEqual([]);
  });
});
