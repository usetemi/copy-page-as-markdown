import TurndownService from "turndown";

// Attributes that carry content in a table kept as HTML. Everything else, such
// as class and style, only costs tokens.
const KEPT_TABLE_ATTRIBUTES = new Set(["href", "src", "alt", "colspan", "rowspan"]);

export function pageToMarkdown(doc: Document): string {
  const omissions = [
    count(doc.querySelectorAll("iframe").length, "iframe"),
    count(
      [...doc.querySelectorAll("*")].filter((el) => el.shadowRoot).length,
      "shadow DOM section",
    ),
  ];

  const body = doc.body.cloneNode(true) as HTMLElement;
  body.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

  let embeddedImages = 0;
  body.querySelectorAll("img").forEach((img) => {
    if (img.getAttribute("src")?.startsWith("data:")) {
      embeddedImages += 1;
      img.replaceWith(img.alt);
    } else if (img.hasAttribute("src")) {
      img.setAttribute("src", img.src);
    }
  });
  omissions.push(count(embeddedImages, "embedded image"));

  body.querySelectorAll("a[href]").forEach((a) => {
    a.setAttribute("href", (a as HTMLAnchorElement).href);
  });

  body.querySelectorAll("table, table *").forEach((el) => {
    for (const name of el.getAttributeNames()) {
      if (!KEPT_TABLE_ATTRIBUTES.has(name)) el.removeAttribute(name);
    }
  });

  // Turndown flattens a table into loose paragraphs; HTML keeps its structure.
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.keep(["table"]);

  const title = doc.title.trim();
  const omitted = omissions.filter(Boolean).join(", ");
  return [
    title && `# ${title}`,
    `Source: ${doc.URL}`,
    turndown.turndown(body),
    omitted && `> Note: omitted ${omitted}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function count(n: number, noun: string): string {
  if (n === 0) return "";
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}
