# CLAUDE.md

Guidelines for Claude Code (claude.ai/code) when touching this repo.

**Read @AGENTS.md first.** It owns architecture, naming, workflow rules, testing expectations, and anything code-related. Keep that file open—this doc just points you there.

## Three Things to Remember

1. Follow that doc for everything: repo layout, commands, coding standards, doc rules, Charlie workflow, MCP guidance, etc.
2. Use the workspace scripts it lists (see below for key commands).
3. Defer to it whenever instructions collide; if something's still unclear, ask the user.

## Key Commands

```bash
# Development (two different apps)
npm run dev:cloud        # Start Tambo Cloud (web + API) - ports 8260 + 8261
npm run dev              # Start React SDK (showcase + docs)

# Quality checks (run before commits)
npm run lint
npm run check-types
npm test

# Database (requires -w flag)
npm run db:generate -w packages/db
npm run db:migrate -w packages/db
npm run db:studio -w packages/db

# Docker (for PostgreSQL in local dev)
docker compose --env-file docker.env up postgres -d
```

## Documentation Structure

- **CONTRIBUTING.md** - Dev setup and PR workflow for contributors
- **OPERATORS.md** - Self-hosting/deployment guide
- **AGENTS.md** - Coding standards, architecture (this is the source of truth)
