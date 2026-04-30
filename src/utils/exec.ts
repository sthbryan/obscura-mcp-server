/**
 * Exec Async
 * Run a command with spawn and return stdout
 */

import { spawn } from "node:child_process";
import { getObscuraPath } from "./obscura";

interface ExecOptions {
  args: string[];
  quiet?: boolean;
}

export async function execAsync(options: ExecOptions): Promise<string> {
  const { args, quiet = true } = options;

  const obscuraPath = getObscuraPath();
  if (!obscuraPath) {
    throw new Error("Obscura not found");
  }

  if (quiet) {
    args.push("--quiet");
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(obscuraPath, args);

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
