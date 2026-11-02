import { pageToMarkdown } from "./convert";

declare global {
  var pageToMarkdown: (doc: Document) => string;
}

globalThis.pageToMarkdown = pageToMarkdown;
