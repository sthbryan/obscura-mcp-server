/**
 * Obscura Utils.
 *
 * Caches both the binary path lookup and the availability probe so we don't
 * spawn a subprocess on every tool call.
 */

import { execFileSync } from "node:child_process";

const OBSCURA_ENV = process.env.OBSCURA_PATH;
const DEFAULT_OBSCURA_NAMES = ["obscura", "obscura.exe"];

/** How long an availability probe stays cached. */
const AVAILABILITY_TTL_MS = 60_000;

let cachedPath: string | null = null;
let cachedPathSearched = false;

function resolvePath(): string | null {
  if (cachedPathSearched) return cachedPath;

  cachedPathSearched = true;
  if (OBSCURA_ENV) {
    cachedPath = OBSCURA_ENV;
    return cachedPath;
  }

  for (const name of DEFAULT_OBSCURA_NAMES) {
    try {
      const stdout = execFileSync("which", [name]).toString().trim();
      if (stdout) {
        cachedPath = stdout;
        return cachedPath;
      }
    } catch (_skipErrors) {
      void _skipErrors;
    }
  }

  cachedPath = null;
  return cachedPath;
}

/** Get the path to the Obscura binary. Cached after first lookup. */
export function getObscuraPath(): string | null {
  return resolvePath();
}

interface CachedAvailability {
  available: boolean;
  expires: number;
}

let cachedAvailability: CachedAvailability | undefined;

function probeBinary(path: string): boolean {
  try {
    execFileSync(path, ["--help"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Check if Obscura is available. Caches the result for AVAILABILITY_TTL_MS. */
export async function checkObscura(): Promise<{ available: boolean }> {
  const now = Date.now();
  if (cachedAvailability && cachedAvailability.expires > now) {
    return { available: cachedAvailability.available };
  }

  const path = resolvePath();
  const available = typeof path === "string" && probeBinary(path);

  cachedAvailability = { available, expires: now + AVAILABILITY_TTL_MS };
  return { available };
}

/** Test-only helper to bust the caches. */
export function __resetObscuraCache(): void {
  cachedPath = null;
  cachedPathSearched = false;
  cachedAvailability = undefined;
}
