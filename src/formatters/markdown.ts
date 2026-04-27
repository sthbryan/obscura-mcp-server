/**
 * Markdown Formatter
 * Converts HTML to Markdown using Turndown
 */

import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export async function formatMarkdown(html: string): Promise<string> {
  const markdown = turndown.turndown(html);
  return markdown;
}
