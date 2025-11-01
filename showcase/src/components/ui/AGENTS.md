# AGENTS.md

Mirror of the CLI registry. Never originate edits here.

- Copy changes from `cli/src/registry` file-for-file. Keep kebab-case filenames,
  matching PascalCase exports, and zero dots (`foo.v2.tsx` forbidden).
- After syncing run `npm run lint && npm run build` in `showcase/`.
- Put showcase-only helpers beside (not inside) mirrored files. If a component
  needs a new hook/util, confirm it exists upstream first.
