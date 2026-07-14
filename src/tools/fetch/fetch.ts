import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { format } from "@/formatters";
import { sanitizeWhitespace } from "@/formatters/clean";
import type { FormatterType } from "@/types/formatters";
import { fetchWithTimeout } from "@/utils/fetch-timeout";

export async function fetchWithNative(
  url: string,
  type: "html" | "markdown" | "text"
): Promise<CallToolResult> {
  const response = await fetchWithTimeout(url);

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
