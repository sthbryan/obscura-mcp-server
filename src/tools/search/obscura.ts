import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import type { SearchResult } from "@/types/search";
import { execAsync } from "@/utils/exec";

export async function searchWithObscura(query: string, limit: number): Promise<CallToolResult> {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const stdout = await execAsync({
    args: ["fetch", searchUrl, "--dump", "links", "--stealth"],
  });

  const results = parseLinks(stdout, searchUrl, limit);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            query,
            source: "obscura",
            results,
          },
          null,
          2
        ),
      },
    ],
  };
}

function parseLinks(text: string, searchUrl: string, limit: number): SearchResult[] {
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (results.length >= limit) break;

    if (!line.includes("\t")) continue;

    const parts = line.split("\t");
    const rawUrl = parts[0]?.trim();
    const title = parts[1]?.trim();

    if (!rawUrl?.startsWith("http")) continue;

    const url = extractRealUrl(rawUrl);

    if (seenUrls.has(url) || url.startsWith(searchUrl)) continue;

    seenUrls.add(url);
    results.push({ title: title || url, url });
  }

  return results;
}

function extractRealUrl(url: string): string {
  const uddgMatch = url.match(/uddg=([^&]+)/);
  if (uddgMatch) {
    try {
      return decodeURIComponent(uddgMatch?.[1] || url);
    } catch {
      return url;
    }
  }
  return url;
}
