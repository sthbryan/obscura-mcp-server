# Obscura MCP Server

> A Model Context Protocol server for web scraping and automation using [Obscura](https://github.com/h4ckf0r0day/obscura)

## Overview

This MCP server provides tools for AI agents to interact with web pages. It uses **Obscura**, a headless browser engine written in Rust with V8 JavaScript support, built specifically for web scraping and AI agent automation.

When Obscura is unavailable, it gracefully falls back to native fetch APIs.

## Tools

### `fetch_page`
Fetch web content from a URL.

```json
{ "url": "https://example.com", "type": "markdown" }
```

### `search`
Search the web and return results.

```json
{ "query": "rust headless browser", "limit": 5 }
```

### `query`
Query a webpage using CSS selectors or text search.

```json
{ "url": "https://example.com", "selector": "h1", "text": "title" }
```

> For client-specific configuration, see [INSTALL.md](./INSTALL.md).

## Requirements

- [Obscura](https://github.com/h4ckf0r0day/obscura) (optional, for enhanced capabilities)
- Node.js 18+ or Bun

## Installation

Add to your MCP servers config:

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["-y", "obscura-mcp-server"]
    }
  }
}
```

See [INSTALL.md](./INSTALL.md) for setup with VSCode, Cursor, OpenCode, Claude Code, Codex, and Pi.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP Client                           │
│                       Coding Agent                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ JSON-RPC
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Obscura MCP Server                        │
│        ┌─────────┐   ┌─────────┐   ┌─────────┐              │
│        │  fetch  │   │ search  │   │  query  │  ← Tools     │
│        └───┬─────┘   └───┬─────┘   └───┬─────┘              │
│            │             │             │                    │
│            ▼             ▼             ▼                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     checkObscura()                      ││
│  └──────────────────────────┬──────────────────────────────┘│
│                             │                               │
│                ┌────────────┴────────────┐                  │
│                ▼                         ▼                  │
│         ┌────────────┐           ┌────────────┐             │
│         │  Obscura   │           │   Native   │             │
│.        │ (headless) │           │   fetch    │             │
│         └────────────┘           └────────────┘             │
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

# Unit tests + coverage
bun test --coverage

# Smoke test (boots the server and calls every tool)
bun run smoke
```

## License

MIT
