/**
 * Search Tool
 * Search the web using Obscura or fallback to DuckDuckGo API.
 *
 * Results are cached for 5 minutes via an LRU keyed on query+limit.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import type { SearchResult } from "@/types/search";
import { fetchWithTimeout } from "@/utils/fetch-timeout";
import { LruCache } from "@/utils/lru";

const cache = new LruCache<string, SearchResult[]>(256, 5 * 60_000);

export async function searchWithNative(query: string, limit: number): Promise<CallToolResult> {
  const cacheKey = `${limit}|${query}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return jsonResult({ query, source: "native", results: cached.slice(0, limit) });
  }

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      Results?: Array<{ Text: string; FirstURL: string }>;
      RelatedTopics?: Array<{ Text: string; FirstURL: string }>;
    };

    const results: SearchResult[] = [];

    if (data.Results) {
      for (const item of data.Results) {
        results.push({
          title: stripHtml(item.Text),
          url: item.FirstURL,
        });
      }
    }

    if (data.RelatedTopics) {
      for (const item of data.RelatedTopics) {
        if (item.FirstURL) {
          results.push({
            title: stripHtml(item.Text),
            url: item.FirstURL,
          });
        }
      }
    }

    cache.set(cacheKey, results);

    return jsonResult({ query, source: "native", results: results.slice(0, limit) });
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

function jsonResult(payload: unknown): CallToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}
