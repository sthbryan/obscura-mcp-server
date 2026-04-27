/**
 * Formatters Registry
 * Centralizes all HTML output formatters
 */

import { formatHtml } from "./html.js";
import { formatMarkdown } from "./markdown.js";
import { formatText } from "./text.js";

export type FormatterType = "html" | "markdown" | "text";

export const formatters: Record<FormatterType, (html: string) => Promise<string>> = {
  html: formatHtml,
  text: formatText,
  markdown: formatMarkdown,
};

export async function format(type: FormatterType, html: string): Promise<string> {
  const formatter = formatters[type];
  if (!formatter) {
    throw new Error(`Unknown formatter type: ${type}`);
  }
  return formatter(html);
}
