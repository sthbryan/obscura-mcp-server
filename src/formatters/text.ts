/**
 * Text Formatter
 * Extracts visible text content from HTML
 */

import { cleanHtml } from "./clean";

export async function formatText(html: string): Promise<string> {
  const text = cleanHtml(html)
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

    .replace(/\n\s*\n/g, "\n")
    .trim();

  return text;
}
