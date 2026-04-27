import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { fetchInputSchema } from "@/schemas/fetch";
import { createFetchHandler } from "./fetch";

export function registerTools(server: McpServer): void {
  server.registerTool(
    "fetch_page",
    {
      title: "Fetch Page",
      description:
        "Fetch web content from a URL and return it in various formats (html, markdown, text).",
      inputSchema: fetchInputSchema,
    },
    createFetchHandler()
  );
}
