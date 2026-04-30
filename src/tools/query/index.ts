/**
 * Query Tool
 * Query data from a webpage using CSS selectors or text search
 *
 * @example selector: "h1" → extracts all matching elements
 * @example text: "Price" → finds element containing exact text
 */

import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import type { QueryInput } from "@/types/query";
import { queryWithObscura } from "./obscura";

export function createQueryHandler() {
  return async (
    args: QueryInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    const { url, selector, text } = args;

    try {
      return await queryWithObscura(url, { selector, text });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Query failed";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  };
}
