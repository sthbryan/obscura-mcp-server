import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types";
import type { FetchInput } from "@/types/fetch";
import { checkObscura } from "@/utils/obscura";
import { fetchWithNative } from "./fetch";
import { fetchWithObscura } from "./obscura";

export function createFetchHandler() {
  return async (
    args: FetchInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    const { url, type, source } = args;

    try {
      if (source === "native") {
        return await fetchWithNative(url, type);
      }

      if (source === "obscura") {
        return await fetchWithObscura(url, type);
      }

      const obscuraStatus = await checkObscura();

      if (obscuraStatus.available) {
        return await fetchWithObscura(url, type);
      }

      return await fetchWithNative(url, type);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  };
}