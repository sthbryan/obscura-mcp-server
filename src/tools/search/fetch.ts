/**
 * Search Tool
 * Search the web using Obscura or fallback to DuckDuckGo API
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import type { SearchResult } from "@/types/search";

export async function searchWithDuckDuckGo(query: string, limit: number): Promise<CallToolResult> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      Results?: Array<{ Text: string; FirstURL: string }>;
      RelatedTopics?: Array<{ Text: string; FirstURL: string }>;
    };

    const results: SearchResult[] = [];

    if (data.Results) {
      for (const item of data.Results.slice(0, limit)) {
        results.push({
          title: stripHtml(item.Text),
          url: item.FirstURL,
        });
      }
    }

    if (data.RelatedTopics && results.length < limit) {
      for (const item of data.RelatedTopics.slice(0, limit - results.length)) {
        if (item.FirstURL) {
          results.push({
            title: stripHtml(item.Text),
            url: item.FirstURL,
          });
        }
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              query,
              source: "fetch",
              results,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    };
  }
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}
