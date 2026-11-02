// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { pageToMarkdown } from "./convert";

function render(html: string, title = "Example page"): string {
  document.title = title;
  document.body.innerHTML = html;
  return pageToMarkdown(document);
}

describe("pageToMarkdown", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("starts with the title and source URL", () => {
    const lines = render("<p>Body</p>").split("\n\n");
    expect(lines[0]).toBe("# Example page");
    expect(lines[1]).toBe(`Source: ${document.URL}`);
    expect(lines[2]).toBe("Body");
  });

  it("leaves out the heading when the page has no title", () => {
    expect(render("<p>Body</p>", "").split("\n\n")[0]).toBe(`Source: ${document.URL}`);
  });

  it("converts headings, links, lists, and fenced code", () => {
    const markdown = render(
      '<h2>Heading</h2><a href="https://example.com/a">Link</a><ul><li>Item</li></ul><pre><code>const a = 1;</code></pre>',
    );
    expect(markdown).toContain("## Heading");
    expect(markdown).toContain("[Link](https://example.com/a)");
    expect(markdown).toMatch(/-\s+Item/);
    expect(markdown).toContain("```\nconst a = 1;\n```");
  });

  it("makes link and image URLs absolute", () => {
    const markdown = render('<a href="/docs">Docs</a><img alt="Chart" src="/chart.png">');
    const origin = new URL(document.URL).origin;
    expect(markdown).toContain(`[Docs](${origin}/docs)`);
    expect(markdown).toContain(`![Chart](${origin}/chart.png)`);
  });

  it("keeps collapsed and hidden content, navigation, and footers", () => {
    const markdown = render(
      "<nav>Menu</nav><details><summary>More</summary><p>Collapsed</p></details><div hidden>Hidden</div><dialog><p>Dialog</p></dialog><footer>Footer</footer>",
    );
    for (const text of ["Menu", "Collapsed", "Hidden", "Dialog", "Footer"]) {
      expect(markdown).toContain(text);
    }
  });

  it("removes script, style, and noscript", () => {
    const markdown = render(
      "<p>Body</p><script>const secret = 1;</script><style>p { color: red; }</style><noscript>Enable JavaScript</noscript>",
    );
    expect(markdown).not.toContain("secret");
    expect(markdown).not.toContain("color");
    expect(markdown).not.toContain("Enable JavaScript");
  });

  it("keeps tables as HTML with only content attributes", () => {
    const markdown = render(
      '<table class="wide" style="color: red"><tr><th colspan="2" class="x">Dose</th></tr><tr><td><a class="y" href="https://example.com/">1 mg</a></td></tr></table>',
    );
    expect(markdown).toContain(
      '<table><tbody><tr><th colspan="2">Dose</th></tr><tr><td><a href="https://example.com/">1 mg</a></td></tr></tbody></table>',
    );
  });

  it("replaces data images with alt text and reports them", () => {
    const markdown = render(
      '<p>Before <img alt="Chart" src="data:image/png;base64,AAAA"> after</p><img alt="" src="data:image/gif;base64,BBBB">',
    );
    expect(markdown).toContain("Before Chart after");
    expect(markdown).not.toContain("base64");
    expect(markdown.endsWith("> Note: omitted 2 embedded images.")).toBe(true);
  });

  it("reports iframes and open shadow roots", () => {
    document.title = "Example page";
    document.body.innerHTML = '<p>Body</p><iframe src="https://example.com/"></iframe><div id="host"></div>';
    document.getElementById("host")?.attachShadow({ mode: "open" });
    expect(pageToMarkdown(document).endsWith("> Note: omitted 1 iframe, 1 shadow DOM section.")).toBe(true);
  });

  it("adds no note when nothing was omitted", () => {
    expect(render("<p>Body</p>")).not.toContain("Note:");
  });

  it("does not change the page", () => {
    const html = '<a href="/docs" class="x">Docs</a><script>1</script><table class="y"><tr><td>1</td></tr></table>';
    document.title = "Example page";
    document.body.innerHTML = html;
    const before = document.body.innerHTML;
    pageToMarkdown(document);
    expect(document.body.innerHTML).toBe(before);
  });
});
