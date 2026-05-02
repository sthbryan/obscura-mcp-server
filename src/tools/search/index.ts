import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import type { SearchInput } from "@/types/search";
import { checkObscura } from "@/utils/obscura";
import { searchWithNative } from "./fetch";
import { searchWithObscura } from "./obscura";

export function createSearchHandler() {
  return async (
    args: SearchInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    const { query, limit, source } = args;

    try {
      if (source === "native") {
        return await searchWithNative(query, limit);
      }

      if (source === "obscura") {
        return await searchWithObscura(query, limit);
      }

      const obscuraStatus = await checkObscura();

      if (obscuraStatus.available) {
        return await searchWithObscura(query, limit);
      }

      return await searchWithNative(query, limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  };
}
