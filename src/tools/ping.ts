import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const pingInputSchema = z.object({
  message: z.string().optional().default("ping"),
});

export type PingInput = z.infer<typeof pingInputSchema>;

export function createPingHandler() {
  return async (
    args: PingInput,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              response: args.message,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  };
}
