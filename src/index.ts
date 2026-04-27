import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { registerTools } from "./tools/index";

const server = new McpServer({
  name: "obscura-mcp-server",
  version: "0.1.0",
});

registerTools(server);

const transport = new StdioServerTransport();

await server.connect(transport);
console.error("Obscura MCP Server running on stdio");
