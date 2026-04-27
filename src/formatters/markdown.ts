/**
 * Markdown Formatter
 * Converts HTML to Markdown using Turndown
 */

import TurndownService from "turndown";
import { cleanHtml } from "./clean";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export async function formatMarkdown(html: string): Promise<string> {
  const markdown = turndown.turndown(cleanHtml(html));
  return markdown;
}
