import { describe, expect, it } from "bun:test";
import { cleanHtml, removeNoiseElements, sanitizeWhitespace } from "./clean";

describe("cleanHtml", () => {
  it("removes script and style tags", () => {
    const html = "<div>hello<script>alert(1)</script><style>p{}</style>world</div>";
    const out = cleanHtml(html);
    expect(out).toContain("hello");
    expect(out).toContain("world");
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
    expect(out).not.toContain("style");
    expect(out).not.toContain("p{}");
  });

  it("removes iframes, forms, inputs", () => {
    const html = '<div><iframe src="x"></iframe><form><input type="text"/></form><p>kept</p></div>';
    const out = cleanHtml(html);
    expect(out).not.toContain("iframe");
    expect(out).not.toContain("form");
    expect(out).not.toContain("input");
    expect(out).toContain("kept");
  });

  it("strips most attributes, keeps href and src", () => {
    const html = '<a href="/x" class="link" id="a1" data-foo="bar">link</a>';
    const out = cleanHtml(html);
    expect(out).toContain('href="/x"');
    expect(out).toContain("link");
    expect(out).not.toContain("class=");
    expect(out).not.toContain("id=");
    expect(out).not.toContain("data-foo=");
  });

  it("removes header and footer selectors", () => {
    const html = "<header>nav</header><article>main</article><footer>foot</footer>";
    const out = cleanHtml(html);
    expect(out).not.toContain("nav");
    expect(out).not.toContain("foot");
    expect(out).toContain("main");
  });

  it("is idempotent (running twice is the same as once)", () => {
    const html = "<div><p>hello</p><script>x</script></div>";
    const once = cleanHtml(html);
    const twice = cleanHtml(once);
    expect(twice).toBe(once);
  });

  it("handles empty input", () => {
    expect(cleanHtml("")).toBe("");
  });
});

describe("removeNoiseElements", () => {
  it("removes nav/footer/aside", () => {
    const html = "<div><nav>menu</nav><p>content</p><footer>foot</footer></div>";
    const out = removeNoiseElements(html);
    expect(out).not.toContain("menu");
    expect(out).not.toContain("foot");
    expect(out).toContain("content");
  });
});

describe("sanitizeWhitespace", () => {
  it("passes markdown through unchanged", () => {
    expect(sanitizeWhitespace("a\n\nb", "markdown")).toBe("a\n\nb");
  });

  it("collapses multiple blank lines for text", () => {
    expect(sanitizeWhitespace("a\n\n\nb", "text")).toBe("a\nb");
  });

  it("collapses runs of spaces and tabs", () => {
    expect(sanitizeWhitespace("a   b\t\tc", "text")).toBe("a b c");
  });

  it("trims each line", () => {
    expect(sanitizeWhitespace("  a  \n  b  ", "text")).toBe("a\nb");
  });
});
