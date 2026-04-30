/**
 * Exec Async
 * Run a command with spawn and return stdout
 */

import { spawn } from "node:child_process";
import { getObscuraPath } from "./obscura";

interface ExecOptions {
  args: string[];
  quiet?: boolean;
  stealth?: boolean;
}

export async function execAsync(options: ExecOptions): Promise<string> {
  const { args, quiet = true, stealth = false } = options;

  const obscuraPath = getObscuraPath();
  if (!obscuraPath) {
    throw new Error("Obscura not found");
  }

  const finalArgs = [...args];
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

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Command failed with code ${code}`));
      } else {
        resolve(stdout);
      }
    });

    proc.on("error", reject);
  });
}
