import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPingHandler, pingInputSchema } from "./ping.js";

export function registerTools(server: McpServer): void {
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Health check tool to verify MCP server is running",
      inputSchema: pingInputSchema,
    },
    createPingHandler()
  );
}
