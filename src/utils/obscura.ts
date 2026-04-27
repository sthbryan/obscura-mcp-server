import { exec, execSync } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const OBSCURA_ENV = process.env.OBSCURA_PATH;
const DEFAULT_OBSCURA_NAMES = ["obscura", "obscura.exe"];

interface ObscuraStatus {
  available: boolean;
  path: string | null;
  version: string | null;
}

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
 * Check if Obscura is available and get version
 */
export async function checkObscura(): Promise<ObscuraStatus> {
  const path = getObscuraPath();

  if (!path) {
    return { available: false, path: null, version: null };
  }

  try {
    const { stdout } = await execAsync(`${path} --help`);
    const version = stdout.includes("obscura") ? "unknown" : null;
    return { available: true, path, version };
  } catch {
    return { available: false, path, version: null };
  }
}

/**
 * Execute an Obscura command
 */
export async function execObscura(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const path = getObscuraPath();
  if (!path) {
    throw new Error("Obscura not found");
  }

  const { stdout, stderr } = await execAsync(`${path} ${args.join(" ")}`);
  return { stdout, stderr };
}
