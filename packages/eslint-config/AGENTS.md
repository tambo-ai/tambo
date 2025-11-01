# AGENTS.md

Shared lint rules. Any tweak hits every workspace.

- Note rule changes in `README.md` (and docs if developer-facing).
- New configs go into `package.json.exports` plus each consumer’s
  `eslint.config.mjs`.
- Configs stay pure ESM—no dynamic imports or fs reads.
- After edits run `npm run lint && npm run check-types` at the repo root and
  ensure required plugin versions live in the workspace.
