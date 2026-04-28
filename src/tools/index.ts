import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { fetchInputSchema } from "@/schemas/fetch";
import { searchInputSchema } from "@/schemas/search";
import { createFetchHandler } from "./fetch";
import { createSearchHandler } from "./search";

export function registerTools(server: McpServer): void {
  server.registerTool(
    "fetch_page",
    {
      title: "Fetch Page",
      description: "Fetch web content from a URL in various formats (html, markdown, text).",
      inputSchema: fetchInputSchema,
    },
    createFetchHandler()
  );

  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search the web and return results with URLs and snippets.",
      inputSchema: searchInputSchema,
    },
    createSearchHandler()
  );
}
