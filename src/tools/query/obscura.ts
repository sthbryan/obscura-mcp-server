import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { parse } from "node-html-parser";
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

  if (selector) {
    const escapedSelector = selector.replace(/'/g, "\\'");
    const evalString = `JSON.stringify(Array.from(document.querySelectorAll('${escapedSelector}')).map(e=>e.textContent.trim()).filter(t=>t))`;

    const stdout = await execAsync({
      args: ["fetch", url, "--eval", evalString, "--dump", "text"],
      stealth: true,
    });

    let result: string[] = [];
    try {
      result = JSON.parse(stdout.trim());
    } catch {
      result = [];
    }

    if (text && result.length > 0) {
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

  const stdout = await execAsync({
    args: ["fetch", url, "--dump", "html"],
    stealth: true,
  });

  const root = parse(stdout);
  const allElements = root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, a, span, div");
  const allText = allElements.map((el) => el.text.trim()).filter((t) => t.length > 0);

  const fuse = new Fuse(allText, { threshold: 0.3 });
  const matches = fuse.search(text!);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url,
            source: "obscura",
            selector: null,
            text,
            result: matches.map((m) => m.item),
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
  };
}