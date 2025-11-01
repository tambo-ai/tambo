# AGENTS.md

This directory is the source of truth for generated components. Drift breaks
`tambo add`/`update` and every mirror.

## Process

- Edit here first, then mirror the exact files into
  `showcase/src/components/ui` and `docs/src/components/tambo` within the same
  commit.
- From `cli/`: `npm run lint && npm run check-types && npm run build`.
- Dry-run every touched component: `node dist/cli.js add <component> --dry-run`.

## Structure

- Folders stay kebab-case and equal `config.json.name`; component exports are
  PascalCase and match `componentName`; never use dots (no `foo.v2`).
- Every path in `config.json.files` must exist. Shared helpers live beside the
  component or under `src/registry/lib/`.

## Hooks/utilities

- New hooks/utils go in `lib/`, get listed in `files`, and are mirrored into
  showcase/docs. If they become public API, expose them through
  `@tambo-ai/react`.
