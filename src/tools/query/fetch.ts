/**
 * Query Tool - native implementation
 *
 * Uses an LRU cache keyed on url+selector+text so repeated identical queries
 * don't reparse the page. Also dedupes text content before fuzzy search
 * because node-html-parser returns each parent's text including all children.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import Fuse from "fuse.js";
import { parse } from "node-html-parser";
import { fetchWithTimeout } from "@/utils/fetch-timeout";
import { LruCache } from "@/utils/lru";

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

interface CachedEntry {
  parser: ReturnType<typeof parse>;
}

const htmlCache = new LruCache<string, CachedEntry>(64, 2 * 60_000);
const resultCache = new LruCache<string, string[]>(256, 2 * 60_000);

function findBestSelector(root: ReturnType<typeof parse>): string {
  for (const selector of MAIN_CONTENT_SELECTORS) {
    const elements = root.querySelectorAll(selector);
    if (elements.length > 0) {
      return selector;
    }
  }
  return DEFAULT_CONTENT_SELECTORS;
}

/**
 * Dedupe an array of strings while preserving order. Useful because
 * querySelectorAll collects parent and child texts which often contain
 * the same content.
 */
function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
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

  const resultKey = `${selector || ""}|${text || ""}|${url}`;
  const cachedResult = resultCache.get(resultKey);
  if (cachedResult) {
    return jsonResult({
      url,
      source: "native",
      selector,
      selector_used: selector || null,
      text,
      result: cachedResult,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const response = await fetchWithTimeout(url);

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

    let entry = htmlCache.get(url);
    if (!entry) {
      entry = { parser: parse(html) };
      htmlCache.set(url, entry);
    }
    const root = entry.parser;

    const resolvedSelector =
      selector ?? (text ? DEFAULT_CONTENT_SELECTORS : findBestSelector(root));

    const result = collectMatches(root, resolvedSelector, text);
    resultCache.set(resultKey, result);

    return jsonResult({
      url,
      source: "native",
      selector,
      selector_used: resolvedSelector,
      text,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed";
    return {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    };
  }
}

function collectMatches(root: ReturnType<typeof parse>, selector: string, text?: string): string[] {
  const escaped = selector.replace(/'/g, "\\'");
  const elements = root.querySelectorAll(escaped);
  const matches = dedupeStrings(elements.map((el) => el.text.trim()).filter((t) => t.length > 0));

  if (text && matches.length > 0) {
    const fuse = new Fuse(matches, { threshold: 0.4 });
    return fuse.search(text).map((m) => m.item);
  }
  return matches;
}

function jsonResult(payload: unknown): CallToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}
