import { afterEach, describe, expect, it, mock } from "bun:test";
import { queryWithObscura } from "./obscura";

describe("queryWithObscura", () => {
  afterEach(() => {
    mock.restore();
  });

  it("returns the selector results parsed from the eval output", async () => {
    mock.module("@/utils/exec", () => ({
      execAsync: async () => '["First","Second"]',
    }));

    const result = await queryWithObscura("https://example.com", {
      selector: "h1",
    });
    expect(result.isError).toBeUndefined();
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
      result: string[];
    };
    expect(p.source).toBe("obscura");
    expect(p.result).toEqual(["First", "Second"]);
  });

  it("fuzzy-filters selector results when text is provided", async () => {
    mock.module("@/utils/exec", () => ({
      execAsync: async () => '["Rust language","Python language","Go language"]',
    }));

    const result = await queryWithObscura("https://example.com", {
      selector: "h1",
      text: "rust",
    });
    const p = JSON.parse((result.content[0] as { text: string }).text) as { result: string[] };
    expect(p.result).toHaveLength(1);
    expect(p.result[0]).toContain("Rust");
  });

  it("falls back to parsing dumped HTML for text-only searches", async () => {
    mock.module("@/utils/exec", () => ({
      execAsync: async () =>
        "<html><body><h1>Rust framework</h1><p>Rust is fast</p><p>Other</p></body></html>",
    }));

    const result = await queryWithObscura("https://example.com", {
      text: "Rust",
    });
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
      result: string[];
      selector: string | null;
    };
    expect(p.source).toBe("obscura");
    expect(p.selector).toBeNull();
    expect(p.result.length).toBeGreaterThan(0);
    expect(p.result[0]).toContain("Rust");
  });

  it("deduplicates text from nested elements in the text path", async () => {
    mock.module("@/utils/exec", () => ({
      execAsync: async () =>
        "<html><body><div><p>Dup</p></div><p>Dup</p><p>Other</p></body></html>",
    }));

    const result = await queryWithObscura("https://example.com", {
      text: "dup",
    });
    const p = JSON.parse((result.content[0] as { text: string }).text) as { result: string[] };
    const dupCount = p.result.filter((t) => t === "Dup").length;
    expect(dupCount).toBe(1);
    expect(p.result.some((t) => t.toLowerCase().includes("dup"))).toBe(true);
  });

  it("returns an error when neither selector nor text is provided", async () => {
    const result = await queryWithObscura("https://example.com", {});
    expect(result.isError).toBe(true);
  });
});
