# AGENTS.md

Shared TS configs. Break them and the repo burns.

- Keep files plain JSON, no comments, no circular `extends`.
- New variants must be documented in `README.md` and adopted by consumers in the
  same change.
- Never loosen compiler options just to hide errors without approval.
- After edits run `npm run check-types` at the root; fix any fallout.
- Changes to paths/module resolution must still work for every extending
  package (check `paths`, `moduleResolution`, `jsx`, etc.).
