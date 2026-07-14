/** Shared HTTP headers and helpers for native fetches. */

/** Mimics a real Chrome on macOS to avoid being blocked by some sites. */
export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const DEFAULT_FETCH_HEADERS: Record<string, string> = {
  "User-Agent": DEFAULT_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

/** Default timeout for native fetch calls (30s). */
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
