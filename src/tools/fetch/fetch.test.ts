import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { fetchWithNative } from "./fetch";
import { fetchWithObscura } from "./obscura";

describe("fetchWithNative", () => {
  afterEach(() => {
    mock.restore();
  });

  it("returns markdown content for the requested URL", async () => {
    const spy = spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("<html><body><h1>Hi</h1><script>x</script></body></html>", {
        status: 200,
      });
    });

    const result = await fetchWithNative("https://example.com", "text");
    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
      type: string;
      content: string;
    };
    expect(payload.source).toBe("native");
    expect(payload.type).toBe("text");
    expect(payload.content).toContain("Hi");
    expect(payload.content).not.toContain("x");
  });

  it("returns html content unchanged modulo cleaning", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("<html><body><p>kept</p><script>gone</script></body></html>", {
        status: 200,
      });
    });
    const result = await fetchWithNative("https://example.com", "html");
    const payload = JSON.parse((result.content[0] as { text: string }).text) as { content: string };
    expect(payload.content).toContain("kept");
    expect(payload.content).not.toContain("gone");
  });

  it("returns an error result when the response is not ok", async () => {
    spyOn(globalThis, "fetch").mockImplementation(async () => {
      return new Response("not found", { status: 404, statusText: "Not Found" });
    });
    const result = await fetchWithNative("https://example.com", "markdown");
    expect(result.isError).toBe(true);
    const payload = JSON.parse((result.content[0] as { text: string }).text) as { error: string };
    expect(payload.error).toContain("404");
  });
});

describe("fetchWithObscura", () => {
  afterEach(() => {
    mock.restore();
  });

  it("delegates to execAsync and returns processed content", async () => {
    mock.module("@/utils/exec", () => ({
      execAsync: async () => "<html><body><h1>Obscura Page</h1><script>junk</script></body></html>",
    }));

    const result = await fetchWithObscura("https://example.com", "text");
    expect(result.isError).toBeUndefined();
    const payload = JSON.parse((result.content[0] as { text: string }).text) as {
      source: string;
      content: string;
    };
    expect(payload.source).toBe("obscura");
    expect(payload.content).toContain("Obscura Page");
    expect(payload.content).not.toContain("junk");
  });
});
