/**
 * Query with Native Fetch
 * Fallback implementation using fetch + HTML parsing
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import Fuse from "fuse.js";
import { parse } from "node-html-parser";

export async function queryWithNative(
  url: string,
  options: { selector?: string; text?: string }
): Promise<CallToolResult> {
  const { selector, text } = options;

  if (!selector && !text) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            error: "Either 'selector' or 'text' must be provided",
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Failed to fetch: ${response.status} ${response.statusText}`,
            }),
          },
        ],
        isError: true,
      };
    }

    const html = await response.text();
    const result = parseHtml(html, { selector, text });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              url,
              selector,
              text,
              result,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed";
    return {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    };
  }
}

function parseHtml(html: string, options: { selector?: string; text?: string }): string[] {
  const { selector, text } = options;
  const root = parse(html);

  if (selector) {
    const elements = root.querySelectorAll(selector);
    return elements.map((el) => el.text.trim()).filter((t) => t.length > 0);
  }

  if (text) {
    const allElements = root.querySelectorAll("*");
    const allText = allElements.map((el) => el.text.trim()).filter((t) => t.length > 0);

    const fuse = new Fuse(allText, { threshold: 0.4 });
    const matches = fuse.search(text);
    return matches.map((m) => m.item);
  }

  return [];
}
