### Docs MCP local server

We recommend using our managed MCP endpoint at `mcp.tambo.co/mcp`. If you prefer to run an MCP server locally for development, follow these steps below.

The server runs without analytics/error logging when the relevant env vars are not set.

### Self-hosting the MCP server locally (recommended default: use `mcp.tambo.co/mcp`)

Code in this repo (vendored from the Inkeep template) lives at: `apps/docs-mcp`.

## 1) Prerequisites

- Node.js 22+
- npm 10+
- A terminal with network access

## 2) Environment variables

Create a `.env.local` in `apps/docs-mcp` with the following or use `.env.example`.

```
INKEEP_API_KEY=your_inkeep_api_key
INKEEP_API_BASE_URL=https://api.inkeep.com/v1
DATABASE_URL=postgres://user:pass@host:5432/dbname  # optional; omit if you don't want usage logging
SENTRY_DSN=                                         # optional
SENTRY_ENVIRONMENT=development                      # optional
```

Notes:

- If `DATABASE_URL` is omitted, anonymous usage logging is skipped.
- If Sentry envs are omitted, error reporting is disabled.

## 3) Install and run locally

From the repo root:

```
npm install
npm run dev --filter=docs-mcp
```

This starts a local Next.js server that exposes the MCP transport route at `/mcp`.

## 4) Test locally

- Hit the server in a browser or via curl to confirm it starts.
- Point your MCP-compatible client at the local URL and select the desired transport.
