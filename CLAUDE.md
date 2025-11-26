# CLAUDE.md

Guidelines for Claude Code (claude.ai/code) when touching this repo.

**Read @AGENTS.md first.** It owns architecture, naming, workflow rules, testing expectations, and anything code-related. Keep that file open—this doc just points you there.

## Three Things to Remember

1. **Follow @AGENTS.md.** It describes the Turborepo layout, command map, coding standards, doc rules, Charlie review flow, MCP notes, etc.
2. **Use the workspace scripts listed in @AGENTS.md.** `npm run dev`, `npm run lint`, `npm run check-types`, `npm test`, `npm run db:*`, and the Docker helpers in `scripts/cloud/` are the source of truth.
3. **Defer to @AGENTS.md for anything unclear.** If instructions conflict, @AGENTS.md wins; otherwise ask the user.

That’s it—stay minimal here so every agent gets the same authoritative direction from @AGENTS.md.
