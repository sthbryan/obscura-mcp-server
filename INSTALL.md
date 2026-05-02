# Installation Guide

This guide covers how to configure the Obscura MCP server with various AI clients.

## Installation Methods

### Method 1: Using bunx (recommended - no installation needed)

Once published to npm (coming soon):

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["obscura-mcp-server"]
    }
  }
}
```

### Method 2: Using npx

```json
{
  "mcpServers": {
    "obscura": {
      "command": "npx",
      "args": ["-y", "obscura-mcp-server"]
    }
  }
}
```

### Method 3: Using global installation

First, install globally:
```bash
npm install -g obscura-mcp-server
# or
bun add -g obscura-mcp-server
```

Then configure:
```json
{
  "mcpServers": {
    "obscura": {
      "command": "obscura-mcp"
    }
  }
}
```

### Method 4: Using local clone

```bash
git clone https://github.com/your-user/obscura-mcp-server
cd obscura-mcp-server
bun install
```

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["run", "/path/to/obscura-mcp-server/src/index.ts"]
    }
  }
}
```

---

## Client Configuration

### VSCode

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Code/User/settings.json` |
| Linux | `~/.config/Code/User/settings.json` |
| Windows | `%APPDATA%\Code\User\settings.json` |

```json
{
  "mcp": {
    "servers": {
      "obscura": {
        "command": "bunx",
        "args": ["obscura-mcp-server"]
      }
    }
  }
}
```

Restart VSCode after editing.

---

### Cursor

| OS | Path |
|----|------|
| macOS | `~/.cursor/mcp.json` |
| Linux | `~/.cursor/mcp.json` |
| Windows | `%USERPROFILE%\.cursor\mcp.json` |

```json
{
  "mcpServers": {
    "obscura": {
      "type": "stdio",
      "command": "bunx",
      "args": ["obscura-mcp-server"]
    }
  }
}
```

Or use workspace-relative path:
```json
{
  "mcpServers": {
    "obscura": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "${workspaceFolder}/src/index.ts"]
    }
  }
}
```

Cursor also supports UI configuration: Settings → Features → Model Context Protocol

---

### OpenCode

| OS | Path |
|----|------|
| macOS | `~/.config/opencode/opencode.json` |
| Linux | `~/.config/opencode/opencode.json` |
| Windows | `%APPDATA%\opencode\opencode.json` |

```json
{
  "mcp": {
    "obscura": {
      "type": "local",
      "command": ["bunx", "obscura-mcp-server"],
      "environment": {
        "OBSCURA_PATH": "/usr/local/bin/obscura"
      },
      "enabled": true
    }
  }
}
```

---

### Claude Code

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["obscura-mcp-server"]
    }
  }
}
```

Or via CLI:
```bash
claude mcp add obscura bunx obscura-mcp-server
claude mcp list
```

---

### Codex

| OS | Path |
|----|------|
| macOS | `~/.codex/config.json` |
| Linux | `~/.codex/config.json` |
| Windows | `%USERPROFILE%\.codex\config.json` |

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["obscura-mcp-server"]
    }
  }
}
```

---

### Pi

Add to your MCP servers config:
To use MCP servers with Pi, you need to install the `pi-mcp-adapter` package and configure it to connect to the Obscura MCP server.
Link to package: https://pi.dev/packages/pi-mcp-adapter

```bash
pi install npm:pi-mcp-adapter
```

Then configure the adapter to point to the Obscura MCP server:

```json
{
  "mcpServers": {
    "obscura": {
      "command": "bunx",
      "args": ["obscura-mcp-server"]
    }
  }
}


---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OBSCURA_PATH` | Path to Obscura binary | looks in PATH |

## Troubleshooting

### Server not starting
- Verify Bun is installed: `bun --version`
- Check the path to the project directory
- Run manually to see errors: `bun run start`

### Obscura not detected
- Install Obscura: https://github.com/h4ckf0r0day/obscura
- Set `OBSCURA_PATH` environment variable (optional if Obscura is not in PATH)
- The server falls back to native fetch if Obscura is unavailable

### Connection issues
- Ensure the server is running (stdio mode)
- Check client logs for JSON-RPC errors
- Try restarting the AI client after config changes