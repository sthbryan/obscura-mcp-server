# Obscura MCP Server

> A Model Context Protocol server for web scraping and automation using [Obscura](https://github.com/h4ckf0r0day/obscura)

## Overview

This MCP server provides tools for AI agents to interact with web pages. It uses **Obscura**, a headless browser engine written in Rust with V8 JavaScript support, built specifically for web scraping and AI agent automation.

When Obscura is unavailable, it gracefully falls back to native fetch APIs.

## Tools

### `fetch_page`
Fetch web content from a URL in various formats.

```json
{
  "url": "https://example.com",
  "type": "markdown"
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | Target URL |
| `type` | string | Output format: `html`, `markdown`, or `text` |

### `search`
Search the web and return results.

```json
{
  "query": "rust headless browser",
  "limit": 5
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query |
| `limit` | number | Max results (default: 5) |

### `query`
Query specific data from a webpage using CSS selectors or text search.

```json
{
  "url": "https://example.com",
  "selector": "h1",
  "text": "Price"
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | Target URL |
| `selector` | string | CSS selector (optional) |
| `text` | string | Text to search for (optional) |

## Requirements

- [Obscura](https://github.com/h4ckf0r0day/obscura) (optional, for enhanced capabilities)
- Node.js 18+ or Bun

## Installation

```bash
npm install
# or
bun install
```

## Configuration

WIP

### Custom Obscura Path

```bash
OBSCURA_PATH=/usr/local/bin/obscura bun run src/index.ts
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Client                             │
│                    (Claude Desktop)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ JSON-RPC
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Obscura MCP Server                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │  fetch  │  │ search  │  │  query  │  ← Tools            │
│  └───┬─────┘  └───┬─────┘  └───┬─────┘                     │
│      │            │            │                            │
│      ▼            ▼            ▼                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              checkObscura()                             ││
│  └────────────────────┬────────────────────────────────────┘│
│                       │                                      │
│          ┌────────────┴────────────┐                        │
│          ▼                         ▼                        │
│   ┌────────────┐           ┌────────────┐                   │
│   │  Obscura   │           │   Native   │                   │
│   │ (headless) │           │   fetch    │                   │
│   └────────────┘           └────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Why Obscura?

| Feature | Obscura | Native Fetch |
|---------|---------|--------------|
| JavaScript execution | ✅ | ❌ |
| Cloudflare bypass | ✅ | ❌ |
| Stealth mode | ✅ | ❌ |
| Wait conditions | ✅ | ❌ |
| DOM manipulation | ✅ | ❌ |
| No dependencies | ❌ | ✅ |

## Development

```bash
# Run in development mode
bun run dev

# Type check
bun run check

# Lint and fix
bun run lint:fix
```

## License

MIT
