import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import Fuse from "fuse.js";
import { execAsync } from "@/utils/exec";

interface QueryOptions {
  selector?: string;
  text?: string;
}

export async function queryWithObscura(
  url: string,
  options: QueryOptions
): Promise<CallToolResult> {
  const { selector, text } = options;

  if (!selector && !text) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: "Either 'selector' or 'text' must be provided" }),
        },
      ],
      isError: true,
    };
  }

  let evalString: string | undefined;

  if (selector) {
    const escapedSelector = selector.replace(/'/g, "\\'");
    evalString = `JSON.stringify(Array.from(document.querySelectorAll('${escapedSelector}')).map(e=>e.textContent.trim()).filter(t=>t))`;
  } else if (text) {
    evalString = `JSON.stringify(Array.from(document.querySelectorAll('*')).filter(e=>e.textContent.includes('${text}')).map(e=>e.textContent.trim()).filter(t=>t).slice(0,20))`;
  }

  const stdout = await execAsync({
    args: [
      "fetch",
      url,
      ...(evalString ? ["--eval", evalString] : []),
      "--wait-until",
      "domcontentloaded",
      "--dump",
      "text",
    ],
    stealth: true,
  });

  let result: string[] = [];

  try {
    result = JSON.parse(stdout.trim());
  } catch {
    if (stdout.trim()) {
      result = [stdout.trim()];
    }
  }

  if (text && selector && result.length > 0) {
    const fuse = new Fuse(result, { threshold: 0.4 });
    const matches = fuse.search(text);
    result = matches.map((m) => m.item);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url,
            source: "obscura",
            selector,
            text,
            result,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
  };
}
