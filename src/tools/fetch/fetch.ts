import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { format } from "@/formatters";
import { sanitizeWhitespace } from "@/formatters/clean";
import type { FormatterType } from "@/types/formatters";

export async function fetchWithNative(
  url: string,
  type: "html" | "markdown" | "text"
): Promise<CallToolResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": // Try to mimic a real browser user agent to avoid being blocked by some sites
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: `Failed to fetch: ${response.status} ${response.statusText}`,
          }),
        },
      ],
      isError: true,
    };
  }

  const html = await response.text();
  const content = await format(type as FormatterType, html);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url,
            type,
            source: "native",
            length: content.length,
            content: sanitizeWhitespace(content, type as FormatterType),
          },
          null,
          2
        ),
      },
    ],
  };
}
