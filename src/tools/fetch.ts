/**
 * Fetch Tool
 * Fetches web content using Obscura or fallback to native fetch
 */

import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import { format } from "@/formatters";
import { cleanHtml } from "@/formatters/clean";
import type { FetchInput } from "@/types/fetch";
import type { FormatterType } from "@/types/formatters";
import { checkObscura, execObscura } from "@/utils/obscura";

export function createFetchHandler() {
  return async (
    args: FetchInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    const { url, type } = args;

    try {
      const obscuraStatus = await checkObscura();

      if (obscuraStatus.available) {
        return await fetchWithObscura(url, type);
      }

      return await fetchWithNative(url, type);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  };
}

async function fetchWithObscura(
  url: string,
  type: "html" | "markdown" | "text"
): Promise<CallToolResult> {
  try {
    const dumpType = type === "markdown" ? "html" : type;
    const { stdout } = await execObscura(["fetch", url, "--dump", dumpType]);

    const lines = stdout
      .split("\n")
      .filter((line) => !line.startsWith("Fetching") && !line.startsWith("Page loaded"));
    let content = cleanHtml(lines.join("\n").trim());

    if (type === "markdown") {
      content = await format("markdown", content);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              url,
              type,
              source: "obscura",
              length: content.length,
              content,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch {
    console.error(`Obscura fetch failed for ${url}, falling back to native fetch`);
    return await fetchWithNative(url, type);
  }
}

async function fetchWithNative(
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
            content,
          },
          null,
          2
        ),
      },
    ],
  };
}
