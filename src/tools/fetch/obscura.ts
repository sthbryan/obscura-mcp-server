import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { format } from "@/formatters";
import { cleanHtml, sanitizeWhitespace } from "@/formatters/clean";
import type { FormatterType } from "@/types/formatters";
import { execAsync } from "@/utils/exec";

export async function fetchWithObscura(
  url: string,
  type: "html" | "markdown" | "text"
): Promise<CallToolResult> {
  const dumpType = type === "markdown" ? "html" : type;

  const stdout = await execAsync({
    args: ["fetch", url, "--dump", dumpType, "--stealth"],
  });

  const lines = stdout
    .split("\n")
    .filter((line) => !line.startsWith("Fetching") && !line.startsWith("Page loaded"));
  let content = cleanHtml(lines.join("\n").trim());

  if (type === "markdown") {
    content = await format("markdown", content);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url,
            type,
            source: "obscura",
            length: content.length,
            content: sanitizeWhitespace(content, type as FormatterType),
          },
          null,
          2
        ),
      },
    ],
  };
}
