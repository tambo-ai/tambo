# CLAUDE.md

Guidelines for Claude Code (claude.ai/code) when touching this repo.

**Read @AGENTS.md first.** It owns architecture, naming, workflow rules, testing expectations, and anything code-related. Keep that file open—this doc just points you there.

## Three Things to Remember

1. Follow that doc for everything: repo layout, commands, coding standards, doc rules, Charlie workflow, MCP guidance, etc.
2. Use the workspace scripts it lists (see below for key commands).
3. Defer to it whenever instructions collide; if something's still unclear, ask the user.

## Avoid RegEx When Possible

- **Prefer string methods**: Simple patterns like `str.includes()`, `str.startsWith()`, `str.split()`, and `str.replace()` are easier to read and maintain.
- **Avoid global flag (`/g`)**: Creates stateful regex objects where `lastIndex` persists between calls, causing subtle bugs.
- **Avoid multiline flag (`/m`)**: Line ending differences across platforms (`\n` vs `\r\n`) cause inconsistent behavior; multiline patterns are harder to reason about.
- **If regex is unavoidable**: Keep it simple, add a comment explaining the pattern, and test edge cases thoroughly.

## Export and Import Patterns

- **No internal barrel files**: Don't create `index.ts` files that just re-export symbols from nearby files. Import directly from the source file. Exception: package entry points (e.g., `packages/core/src/index.ts`) are fine.
- **No backwards-compatibility re-exports**: When moving a symbol from one file to another, update all consumers to import from the new location. Don't leave behind re-exports "for convenience."

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
