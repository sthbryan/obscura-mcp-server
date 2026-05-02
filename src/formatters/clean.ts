/**
 * Clean HTML - Remove unnecessary tags for LLM consumption
 */

import { parse } from "node-html-parser";
import type { FormatterType } from "@/types/formatters";

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

const NOISE_SELECTORS = [
  "nav",
  "footer",
  "aside",
  "header:not(article header)",
  ".ads",
  ".advertisement",
  '[class*="ad-"]',
  ".sidebar",
  ".side-bar",
  ".social",
  ".share",
  ".newsletter",
  '[class*="cookie"]',
  '[class*="popup"]',
  ".nav",
  ".menu",
  ".header:not(header > h1)",
  ".cookie",
  ".popup",
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
  '[aria-hidden="true"]',
];

export function removeNoiseElements(html: string): string {
  const root = parse(html);
  for (const selector of NOISE_SELECTORS) {
    try {
      for (const el of root.querySelectorAll(selector)) {
        el.remove();
      }
    } catch {}
  }

  return root.toString();
}

export function cleanHtml(html: string): string {
  let result = html;

  const root = parse(result);
  for (const tag of USELESS_TAGS) {
    for (const el of root.querySelectorAll(tag)) {
      el.remove();
    }
  }
  result = root.toString();

  result = removeNoiseElements(result);

  const cleanRoot = parse(result);
  for (const el of cleanRoot.querySelectorAll("*")) {
    const attrs = el.attributes;
    for (const attr of Object.keys(attrs)) {
      if (!USEFUL_ATTRS.includes(attr)) {
        el.removeAttribute(attr);
      }
    }
  }

  return cleanRoot.toString();
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
}
