import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import Fuse from "fuse.js";
import { parse } from "node-html-parser";

interface QueryOptions {
  selector?: string;
  text?: string;
}

const MAIN_CONTENT_SELECTORS = [
  "article",
  'main[role="main"]',
  ".post-content",
  ".article-content",
  ".entry-content",
  "main",
];

const DEFAULT_CONTENT_SELECTORS = "p, h1, h2, h3, h4, h5, h6, li, a, span";

function findBestSelector(html: string): string {
  const root = parse(html);
  for (const selector of MAIN_CONTENT_SELECTORS) {
    const elements = root.querySelectorAll(selector);
    if (elements.length > 0 && selector !== "body") {
      return selector;
    }
  }
  return DEFAULT_CONTENT_SELECTORS;
}

export async function queryWithNative(url: string, options: QueryOptions): Promise<CallToolResult> {
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
    let resolvedSelector = selector;

    if (!resolvedSelector) {
      resolvedSelector = text ? DEFAULT_CONTENT_SELECTORS : findBestSelector(html);
    }

    const result = parseHtml(html, { selector: resolvedSelector, text });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              url,
              source: "native",
              selector,
              selector_used: resolvedSelector,
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
    const escapedSelector = selector.replace(/'/g, "\\'");
    const elements = root.querySelectorAll(escapedSelector);
    const results = elements.map((el) => el.text.trim()).filter((t) => t.length > 0);

    if (text && results.length > 0) {
      const fuse = new Fuse(results, { threshold: 0.4 });
      const matches = fuse.search(text);
      return matches.map((m) => m.item);
    }

    return results;
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
