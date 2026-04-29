# Penpot MCP Server Reference

The **Penpot MCP Server** (MPL-2.0) exposes Penpot to MCP-compatible AI
clients — Claude Desktop, Claude Code, Cursor, VS Code + Copilot, OpenAI
Codex — so an agent can read and (optionally) write Penpot designs.

## Architecture

```
┌────────────────┐   MCP   ┌──────────────┐   WebSocket  ┌──────────────┐
│ AI Client      │ ──────▶ │ MCP Server   │ ◀──────────▶ │ MCP Plugin   │
│ (Claude Code)  │         │ (local/remote)│              │ (in Penpot) │
└────────────────┘         └──────────────┘              └──────────────┘
```

1. **MCP Server** — exposes tools to AI clients over the MCP protocol.
2. **MCP Plugin** — runs inside Penpot, connects to the server via WebSocket,
   executes operations the AI requests.
3. **MCP Client** — your AI tool.

## Tools (local mode)

| Tool                   | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `execute_code`         | Run Plugin-API JS against the current file.             |
| `high_level_overview`  | Get a summarized tree of the current page/file.         |
| `penpot_api_info`      | Inline API reference — use before `execute_code`.       |
| `export_shape`         | Export a shape as PNG/SVG/PDF/binary for inspection.    |
| `import_image`         | Import an image into the current Penpot file.           |

## Setup

### Local

1. Run the MCP plugin inside Penpot (from the Plugins panel).
2. The MCP server listens at `http://localhost:4401/mcp`.
3. Configure your client to connect to that URL.

### Remote (hosted)

`Your account → Integrations → MCP Server (Beta)` → generate an **MCP key** →
configure the client with the hosted URL + key.

## Safety guidance

- **Start read-only.** Only enable `content:write` / `library:write`
  permissions after you've reviewed the plan and understand the scope of
  changes the model proposes.
- **Use `high_level_overview` first** to understand the current state before
  generating any edit commands.
- **Prefer `execute_code` that's idempotent** — creating named boards/components
  rather than positional edits that depend on state you didn't inspect.
- **Export before destructive operations.** A `File.export` returns a
  `.penpot` you can restore from if something goes wrong.

## When to use the MCP server

- You want Claude to understand and summarize an existing Penpot design.
- You want Claude to generate a new design from a spec or wireframe.
- You want Claude to iterate on a design — test → inspect → revise.

Do **not** use the MCP server to make bulk changes to production files
without human review. The Plugin API can mutate freely and there is no
automatic undo stack for agent-driven batches.
