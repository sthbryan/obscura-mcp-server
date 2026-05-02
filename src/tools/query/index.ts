/**
 * Query Tool
 * Query data from a webpage using CSS selectors or text search
 *
 * @example selector: "h1" → extracts all matching elements
 * @example text: "Price" → finds element containing exact text
 */

import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import { parse } from "node-html-parser";
import type { QueryInput } from "@/types/query";
import { checkObscura } from "@/utils/obscura";
import { queryWithNative } from "./fetch";
import { queryWithObscura } from "./obscura";

const MAIN_CONTENT_SELECTORS = [
  "article",
  'main[role="main"]',
  ".post-content",
  ".article-content",
  ".entry-content",
  "main",
  "body",
];

function findMainContentSelector(html: string): string | null {
  const root = parse(html);

  for (const selector of MAIN_CONTENT_SELECTORS) {
    const elements = root.querySelectorAll(selector);
    if (elements.length > 0) {
      return selector;
    }
  }

  return null;
}

export function createQueryHandler() {
  return async (
    args: QueryInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    const { url, selector, text } = args;

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

    let selector_used: string | null = selector ?? null;

    if (!selector && text) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        if (response.ok) {
          const html = await response.text();
          selector_used = findMainContentSelector(html);
        }
      } catch {}
    }

    try {
      const obscuraStatus = await checkObscura();

      let result: CallToolResult;
      if (obscuraStatus.available) {
        result = await queryWithObscura(url, { selector: selector_used || undefined, text });
      } else {
        result = await queryWithNative(url, { selector: selector_used || undefined, text });
      }

      if (!result.isError && result.content[0]) {
        const first = result.content[0];
        if (first.type === "text") {
          try {
            const parsed = JSON.parse(first.text);
            parsed.selector_used = selector_used;
            first.text = JSON.stringify(parsed, null, 2);
          } catch {}
        }
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message, selector_used }) }],
        isError: true,
      };
    }
  };
}
