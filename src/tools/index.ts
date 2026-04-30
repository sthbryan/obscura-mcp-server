import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchInputSchema } from "@/schemas/fetch";
import { queryInputSchema } from "@/schemas/query";
import { searchInputSchema } from "@/schemas/search";
import { createFetchHandler } from "@/tools/fetch";
import { createQueryHandler } from "@/tools/query";
import { createSearchHandler } from "@/tools/search";

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

  server.registerTool(
    "query",
    {
      title: "Query",
      description: "Get specific data from a webpage using CSS selectors or text search.",
      inputSchema: queryInputSchema,
    },
    createQueryHandler()
  );
}
