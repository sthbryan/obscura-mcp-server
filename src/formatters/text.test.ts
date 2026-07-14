import { describe, expect, it } from "bun:test";
import { formatText } from "./text";

describe("formatText", () => {
  it("strips tags and keeps visible text", async () => {
    const html = "<div>hello <b>world</b></div>";
    expect(await formatText(html)).toBe("hello world");
  });

  it("inserts newlines at block closings", async () => {
    const html = "<p>a</p><p>b</p>";
    expect(await formatText(html)).toBe("a\nb");
  });

  it("decodes common HTML entities", async () => {
    expect(await formatText("<p>Tom &amp; Jerry</p>")).toBe("Tom & Jerry");
    expect(await formatText("<p>&lt;tag&gt;</p>")).toBe("<tag>");
    expect(await formatText("<p>&quot;hi&quot;</p>")).toBe('"hi"');
  });

  it("collapses double newlines", async () => {
    expect(await formatText("<p>a</p><p></p><p>b</p>")).toBe("a\nb");
  });
});
