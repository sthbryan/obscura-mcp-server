/**
 * Exec Async
 * Run a command with spawn and return stdout.
 *
 * Includes a hard timeout (default 60s) so a hung Obscura instance can't
 * block the MCP server indefinitely.
 */

import { spawn } from "node:child_process";
import { getObscuraPath } from "./obscura";

interface ExecOptions {
  args: string[];
  quiet?: boolean;
  stealth?: boolean;
  /** Timeout in ms before the child is SIGKILLed. Default: 60_000. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;

class ExecTimeoutError extends Error {
  constructor(ms: number) {
    super(`Obscura timed out after ${ms}ms`);
    this.name = "ExecTimeoutError";
  }
}

export async function execAsync(options: ExecOptions): Promise<string> {
  const { args, quiet = true, stealth = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const obscuraPath = getObscuraPath();
  if (!obscuraPath) {
    throw new Error("Obscura not found");
  }

  const finalArgs = [...args];
  finalArgs.push("--wait-until", "domcontentloaded");

  if (quiet) {
    finalArgs.push("--quiet");
  }
  if (stealth) {
    finalArgs.push("--stealth");
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(obscuraPath, finalArgs);

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        proc.kill("SIGKILL");
      } catch {}
      reject(new ExecTimeoutError(timeoutMs));
    }, timeoutMs);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr || `Command failed with code ${code}`));
      } else {
        resolve(stdout);
      }
    });

    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}
