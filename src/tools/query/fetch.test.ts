import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { queryWithNative } from "./fetch";

describe("queryWithNative", () => {
  afterEach(() => {
    mock.restore();
  });

  it("returns matching elements for a selector", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("<html><body><h1>One</h1><h1>Two</h1><p>three</p></body></html>", {
        status: 200,
      });
    });
    const result = await queryWithNative("https://query-with-selector.test", {
      selector: "h1",
    });
    const p = JSON.parse((result.content[0] as { text: string }).text) as { result: string[] };
    expect(p.result).toEqual(["One", "Two"]);
  });

  it("fuzzy-matches text against the selected content", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(
        "<html><body><h1>Rust headless</h1><h1>Python browser</h1></body></html>",
        { status: 200 }
      );
    });
    const result = await queryWithNative("https://query-with-fuzzy.test", {
      selector: "h1",
      text: "rust",
    });
    const p = JSON.parse((result.content[0] as { text: string }).text) as { result: string[] };
    expect(p.result[0]).toContain("Rust");
    expect(p.result).toHaveLength(1);
  });

  it("finds elements containing text across default content selectors", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("<html><body><p>Rust is fast</p><h1>Rust framework</h1></body></html>", {
        status: 200,
      });
    });
    const result = await queryWithNative("https://query-with-text-only.test", {
      text: "Rust",
    });
    const p = JSON.parse((result.content[0] as { text: string }).text) as {
      result: string[];
      selector_used: string;
    };
    expect(p.result.length).toBeGreaterThan(0);
    expect(p.selector_used).toContain("p, h1");
  });

  it("returns an error when neither selector nor text is provided", async () => {
    const result = await queryWithNative("https://no-selector.test", {});
    expect(result.isError).toBe(true);
    const p = JSON.parse((result.content[0] as { text: string }).text) as { error: string };
    expect(p.error).toContain("Either");
  });

  it("returns an error on non-ok response", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("nope", { status: 500, statusText: "Server Error" });
    });
    const result = await queryWithNative("https://query-error.test", {
      selector: "h1",
    });
    expect(result.isError).toBe(true);
  });

  it("deduplicates identical text from sibling elements", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response(
        `<html><body>
          <p>Same text</p>
          <p>Same text</p>
          <p>Different</p>
        </body></html>`,
        { status: 200 }
      );
    });
    const result = await queryWithNative("https://query-dedupe.test", {
      selector: "p",
    });
    const p = JSON.parse((result.content[0] as { text: string }).text) as { result: string[] };
    expect(p.result.filter((t) => t === "Same text")).toHaveLength(1);
    expect(p.result).toContain("Different");
  });
});
