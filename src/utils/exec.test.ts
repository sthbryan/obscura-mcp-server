/**
 * Tests for execAsync: timeout enforcement and child-process error propagation.
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { EventEmitter } from "node:events";

interface FakeChild extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: (sig?: string) => boolean;
}

function makeFakeChild(opts: { stdout?: string; exitCode?: number; hang?: boolean }): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => true;

  if (opts.hang) {
    child.kill = (() => {
      queueMicrotask(() => child.emit("close", 137));
      return true;
    }) as FakeChild["kill"];
    return child;
  }

  queueMicrotask(() => {
    if (opts.stdout) child.stdout.emit("data", Buffer.from(opts.stdout));
    child.emit("close", opts.exitCode ?? 0);
  });
  return child;
}

function setupSpawnMock(factory: () => FakeChild): void {
  mock.module("node:child_process", () => ({
    spawn: factory,
  }));
}

function setupPathMock(path: string | null): void {
  mock.module("@/utils/obscura", () => ({
    getObscuraPath: () => path,
  }));
}

describe("execAsync", () => {
  let execAsync: typeof import("./exec").execAsync;

  beforeEach(async () => {
    mock.restore();
    const mod = await import("./exec");
    execAsync = mod.execAsync;
  });

  it("resolves with stdout when the child exits 0", async () => {
    setupPathMock("/bin/echo");
    setupSpawnMock(() => makeFakeChild({ stdout: "hello" }));

    const out = await execAsync({ args: ["any"] });
    expect(out).toBe("hello");
  });

  it("rejects when the child exits non-zero", async () => {
    setupPathMock("/bin/echo");
    setupSpawnMock(() => makeFakeChild({ exitCode: 1 }));

    await expect(execAsync({ args: ["any"] })).rejects.toThrow();
  });

  it("rejects with a timeout error when the child hangs", async () => {
    setupPathMock("/bin/echo");
    setupSpawnMock(() => makeFakeChild({ hang: true }));

    await expect(execAsync({ args: ["any"], timeoutMs: 50 })).rejects.toThrow("timed out");
  });

  it("rejects when obscura path cannot be resolved", async () => {
    setupPathMock(null);

    await expect(execAsync({ args: ["any"] })).rejects.toThrow("Obscura not found");
  });
});
