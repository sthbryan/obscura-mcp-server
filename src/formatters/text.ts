/**
 * Text Formatter
 * Extracts visible text content from HTML
 */

export async function formatText(html: string): Promise<string> {
  const text = html

    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

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
