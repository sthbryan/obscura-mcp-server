#!/usr/bin/env bun
/**
 * Smoke test: boots the MCP server, lists tools, calls each one.
 *
 * Usage:
 *   bun run scripts/smoke-test.ts
 */

import { spawn } from "node:child_process";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

function call(
  proc: ReturnType<typeof spawn>,
  method: string,
  params?: unknown,
  id = 1
): Promise<JsonRpcResponse> {
  const req: JsonRpcRequest = {
    jsonrpc: "2.0",
    id,
    method,
    ...(params ? { params } : {}),
  };
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let buffer = "";
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      let newline: number;
      newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line) as JsonRpcResponse;
          if (msg.id === id) {
            proc?.stdout?.off("data", onData);
            resolve(msg);
            return;
          }
        } catch {
          /* keep buffering */
        }
        newline = buffer.indexOf("\n");
      }
      chunks.push(chunk);
    };
    proc?.stdout?.on("data", onData);
    proc?.stdin?.write(`${JSON.stringify(req)}\n`);
    setTimeout(() => reject(new Error(`Timeout calling ${method}`)), 60_000);
  });
}

async function main(): Promise<void> {
  const proc = spawn("bun", ["run", "src/index.ts"], {
    stdio: ["pipe", "pipe", "inherit"],
  });

  try {
    const init = await call(proc, "initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "smoke-test", version: "0.0.0" },
    });
    console.log("✓ initialized:", JSON.stringify(init.result));

    const list = await call(proc, "tools/list", undefined, 2);
    const tools = (list.result as { tools: Array<{ name: string }> }).tools;
    console.log(`✓ listed tools: ${tools.map((t) => t.name).join(", ")}`);

    const search = await call(
      proc,
      "tools/call",
      {
        name: "search",
        arguments: { query: "TypeScript latest version", limit: 3 },
      },
      3
    );
    const searchText = JSON.stringify(search.result);
    console.log(
      `✓ search: ${searchText.length} bytes${search.error ? ` ERROR: ${search.error.message}` : ""}`
    );

    const query = await call(
      proc,
      "tools/call",
      {
        name: "query",
        arguments: { url: "https://example.com", text: "Example Domain" },
      },
      4
    );
    const queryText = JSON.stringify(query.result);
    console.log(
      `✓ query: ${queryText.length} bytes${query.error ? ` ERROR: ${query.error.message}` : ""}`
    );

    const fetch = await call(
      proc,
      "tools/call",
      {
        name: "fetch_page",
        arguments: { url: "https://example.com", type: "text" },
      },
      5
    );
    const fetchText = JSON.stringify(fetch.result);
    console.log(
      `✓ fetch_page: ${fetchText.length} bytes${
        fetch.error ? ` ERROR: ${fetch.error.message}` : ""
      }`
    );

    console.log("\nAll smoke tests responded.");
  } finally {
    proc.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("smoke test failed:", err);
  process.exit(1);
});
