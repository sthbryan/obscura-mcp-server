import { describe, expect, it } from "bun:test";
import { formatHtml } from "./html";

describe("formatHtml", () => {
  it("removes script and style", async () => {
    const html = "<div>a<script>x</script><style>{}</style>b</div>";
    const out = await formatHtml(html);
    expect(out).toContain("a");
    expect(out).toContain("b");
    expect(out).not.toContain("script");
    expect(out).not.toContain("style");
  });

  it("removes noise sections", async () => {
    const html = "<nav>menu</nav><article>main</article><footer>foot</footer>";
    const out = await formatHtml(html);
    expect(out).not.toContain("menu");
    expect(out).toContain("main");
    expect(out).not.toContain("foot");
  });

  it("keeps href and src, drops other attributes", async () => {
    const html = '<img src="/x.png" alt="x" width="100" /><a href="/y" class="c">link</a>';
    const out = await formatHtml(html);
    expect(out).toContain('src="/x.png"');
    expect(out).toContain('href="/y"');
    expect(out).not.toContain("alt=");
    expect(out).not.toContain("class=");
  });
});
