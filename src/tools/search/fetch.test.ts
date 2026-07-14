import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { searchWithNative } from "./fetch";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status });
}

describe("searchWithNative", () => {
  afterEach(() => {
    mock.restore();
  });

  it("returns parsed results from DuckDuckGo", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return jsonResponse({
        Results: [{ Text: "TypeScript <b>5.9</b>", FirstURL: "https://ts.example/" }],
        RelatedTopics: [
          {
            Text: "Announcing TypeScript",
            FirstURL: "https://announce.example/",
          },
        ],
      });
    });

    const result = await searchWithNative("typescript", 3);
    expect(result.isError).toBeUndefined();
    const payload = JSON.parse((result.content[0] as { text: string }).text) as {
      query: string;
      source: string;
      results: Array<{ title: string; url: string }>;
    };
    expect(payload.source).toBe("native");
    expect(payload.query).toBe("typescript");
    expect(payload.results[0]?.url).toBe("https://ts.example/");
    expect(payload.results[1]?.url).toBe("https://announce.example/");
  });

  it("strips HTML tags from titles", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return jsonResponse({
        Results: [{ Text: "A <em>bold</em> title", FirstURL: "https://x" }],
      });
    });
    const result = await searchWithNative("query", 5);
    const payload = JSON.parse((result.content[0] as { text: string }).text) as {
      results: Array<{ title: string }>;
    };
    expect(payload.results[0]?.title).toBe("A bold title");
  });

  it("respects the limit", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return jsonResponse({
        Results: Array.from({ length: 20 }, (_, i) => ({
          Text: `R${i}`,
          FirstURL: `https://x/${i}`,
        })),
      });
    });
    const result = await searchWithNative("test", 5);
    const payload = JSON.parse((result.content[0] as { text: string }).text) as {
      results: unknown[];
    };
    expect(payload.results).toHaveLength(5);
  });

  it("returns an error on non-ok response", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("rate limited", { status: 429 });
    });
    const result = await searchWithNative("unique-error-test", 5);
    expect(result.isError).toBe(true);
    const payload = JSON.parse((result.content[0] as { text: string }).text) as { error: string };
    expect(payload.error).toContain("429");
  });

  it("skips RelatedTopics entries without FirstURL", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return jsonResponse({
        Results: [],
        RelatedTopics: [
          { Text: "no url", FirstURL: "" },
          { Text: "with url", FirstURL: "https://ok" },
        ],
      });
    });
    const result = await searchWithNative("test", 10);
    const payload = JSON.parse((result.content[0] as { text: string }).text) as {
      results: Array<{ url: string }>;
    };
    expect(payload.results).toHaveLength(1);
    expect(payload.results[0]?.url).toBe("https://ok");
  });
});
