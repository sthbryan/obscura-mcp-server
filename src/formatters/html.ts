/**
 * HTML Formatter
 * Returns raw HTML content
 */

import { cleanHtml } from "./clean";

export async function formatHtml(html: string): Promise<string> {
  return cleanHtml(html);
}
