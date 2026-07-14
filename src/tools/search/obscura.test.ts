import { describe, expect, it } from "bun:test";
import { extractRealUrl, parseLinks } from "./obscura";

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
