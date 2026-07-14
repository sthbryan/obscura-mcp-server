/** fetchWithTimeout: native fetch that aborts after a deadline. */

import { DEFAULT_FETCH_HEADERS, DEFAULT_FETCH_TIMEOUT_MS } from "./http";

export async function fetchWithTimeout(
  url: string,
  options: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, headers = {} } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: { ...DEFAULT_FETCH_HEADERS, ...headers },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}
