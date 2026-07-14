import { describe, expect, it } from "bun:test";
import { formatMarkdown } from "./markdown";

describe("formatMarkdown", () => {
  it("converts headings", async () => {
    const out = await formatMarkdown("<h1>Title</h1>");
    expect(out.trim()).toBe("# Title");
  });

  it("converts links", async () => {
    const out = await formatMarkdown('<a href="/x">click</a>');
    expect(out).toContain("[click](/x)");
  });

  it("converts code blocks with fences", async () => {
    const out = await formatMarkdown("<pre><code>const x = 1;</code></pre>");
    expect(out).toContain("```");
    expect(out).toContain("const x = 1;");
  });

  it("strips script content before converting", async () => {
    const out = await formatMarkdown("<div>ok<script>alert(1)</script></div>");
    expect(out).toContain("ok");
    expect(out).not.toContain("alert");
  });
});
