/**
 * Obscura Utils
 */

import { execSync } from "node:child_process";

const OBSCURA_ENV = process.env.OBSCURA_PATH;
const DEFAULT_OBSCURA_NAMES = ["obscura", "obscura.exe"];

/**
 * Get the path to the Obscura binary
 */
export function getObscuraPath(): string | null {
  if (OBSCURA_ENV) return OBSCURA_ENV;

  for (const name of DEFAULT_OBSCURA_NAMES) {
    try {
      const result = execSync(`which ${name}`);
      const stdout = result.toString().trim();
      if (stdout) return stdout;
    } catch {}
  }

  return null;
}

/**
 * Check if Obscura is available
 */
export async function checkObscura(): Promise<{ available: boolean }> {
  const path = getObscuraPath();
  if (!path) return { available: false };

  try {
    require("node:child_process").execSync(`${path} --help`, { stdio: "ignore" });
    return { available: true };
  } catch {
    return { available: false };
  }
}
