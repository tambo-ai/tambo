# AGENTS.md

Mirror of the CLI registry. Only touch files already fixed upstream.

- Copy updates from `cli/src/registry` exactly—same folders, kebab-case names,
  PascalCase exports, no dots.
- Add matching MDX usage in `content/docs/` when new components land.
- After syncing run `npm run lint && npm run build` in `docs/`.
- New hook/util dependencies must already exist in the CLI source.
