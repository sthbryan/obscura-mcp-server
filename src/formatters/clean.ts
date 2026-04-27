/**
 * Clean HTML - Remove unnecessary tags for LLM consumption
 */

import { FormatterType } from "@/types/formatters";
import { parse } from "node-html-parser";

const USELESS_TAGS = [
  "head",
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "form",
  "input",
  "button",
];

const USEFUL_ATTRS = ["href", "src"];

export function cleanHtml(html: string): string {
  const root = parse(html);

  for (const tag of USELESS_TAGS) {
    for (const el of root.querySelectorAll(tag)) {
      el.remove();
    }
  }

  for (const el of root.querySelectorAll("*")) {
    const attrs = el.attributes;
    for (const attr of Object.keys(attrs)) {
      if (!USEFUL_ATTRS.includes(attr)) {
        el.removeAttribute(attr);
      }
    }
  }

  return root.toString();
}

export function sanitizeWhitespace(text: string, type: FormatterType): string {
  if (type === "markdown") return text;

  return text
    .replace(/\n\s*\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

  // return text
  //   .replace(/[\n\r\t]+/g, " ")
  //   .replace(/\s{2,}/g, " ")
  //   .trim();
}
