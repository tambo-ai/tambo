---
title: Skills CRUD UI — Settings Page Patterns
category: architecture
tags:
  [
    tRPC,
    react,
    settings-ui,
    yaml-parsing,
    drag-and-drop,
    postgres-constraints,
    inline-form,
  ]
module: apps/web, packages/db
created: 2026-03-26
pr: "#2691"
---

# Skills CRUD UI — Settings Page Patterns

Collection of patterns established while building the skills management UI in project settings (PR #2691). These are reusable for any future CRUD section added to the settings page.

## 1. Adding a New Settings Section

The settings page (`apps/web/components/dashboard-components/project-settings.tsx`) uses a scroll-to-section pattern with refs. To add a new section:

1. Add a `useRef<HTMLDivElement>(null)` for the section
2. Add the key to the `scrollToSection` refs map
3. Add a `<Button variant="ghost">` in **both** desktop sidebar and mobile dropdown
4. Render the section component inside `<div ref={yourRef} className="p-2">`

The section component receives `projectId` as a prop and manages its own tRPC queries/mutations internally.

## 2. Postgres Unique Constraint Error Handling

**Problem:** Need to show user-friendly error messages when a DB unique constraint is violated (e.g., duplicate skill name).

**Solution:** Domain error in the DB layer, translated to tRPC error in the router.

```
DB layer (packages/db) → catches DatabaseError from pg-protocol
                       → checks error.code === "23505" AND error.constraint === "constraint_name"
                       → throws SkillNameConflictError (domain error)

tRPC router (apps/web) → catches SkillNameConflictError
                       → throws TRPCError({ code: "CONFLICT", message: error.message })

UI component           → mutation onError shows destructive toast with error.message
```

Key details:

- Import `DatabaseError` from `pg-protocol` only in `packages/db` (not in the tRPC layer)
- Check BOTH `error.code` (Postgres error code `"23505"`) AND `error.constraint` (the specific constraint name) to avoid false positives
- Export the domain error class from `packages/db/src/index.ts`
- The tRPC router uses `instanceof` check — no string matching on error messages

## 3. YAML Frontmatter Parsing (Safe Mode)

**Problem:** Need to parse SKILL.md files (YAML frontmatter + markdown body) in the browser.

**Solution:** Minimal custom parser using `js-yaml` v4 + Zod validation.

Why not `gray-matter` or `front-matter` npm packages:

- `gray-matter` depends on `js-yaml` v3 which has unsafe defaults (`!!js/function` code execution)
- `front-matter` also uses `js-yaml` v3 internally

Why `js-yaml` v4:

- Safe by default (`DEFAULT_SCHEMA` — no code execution)
- Already in the dependency tree
- Tiny: only parsing 2-3 lines of YAML (the frontmatter), not the full body

The parser:

- Normalizes `\r\n` → `\n` for Windows paste compatibility
- Splits on `---` delimiters with a regex
- Parses the YAML block with `js-yaml` `load()`
- Validates with Zod `safeParse` (catches non-string values like `name: 123`)
- Returns a discriminated union: `ParseSuccess | ParseFailure`

The reconstructor uses `js-yaml` `dump()` with `{ lineWidth: -1 }` for proper YAML escaping on round-trip (handles colons, quotes, newlines in values).

## 4. Inline Form with Key-Based State Reset

**Problem:** An inline form needs to reset its state when switching between create mode and different skills in edit mode.

**Solution:** Use React's `key` prop to force remount instead of `useEffect` for state sync.

```tsx
<SkillForm
  key={isFormOpen ? `${editingSkill?.id ?? "new"}-${importedFields ? "import" : "manual"}` : "closed"}
  skill={editingSkill}
  ...
/>
```

Include the form open state and import mode in the key so that switching between create/edit/import modes always remounts. Without it, stale field values persist.

Inside the form, use `useState` with an initializer function -- it runs fresh on each mount:

```tsx
const [name, setName] = useState(initialFields?.name ?? skill?.name ?? "");
```

No `useEffect` needed for form initialization.

## 5. File Import with Overwrite Confirmation

**Pattern for importing files that might conflict with existing data:**

1. Read file with `FileReader.readAsText()`
2. Parse the content to extract the identifying field (e.g., skill name from frontmatter)
3. Check against the cached list for conflicts
4. If conflict: show an `AlertDialog` asking to overwrite
5. If user confirms: open edit form for the existing item with the imported content
6. If no conflict: open create form with the imported content

The overwrite check is a **UX convenience** (client-side, uses cached data). The real enforcement is server-side (unique constraint -> domain error -> toast).

The inline form accepts an `initialFields` prop that overrides the normal field values from DB, used for both import and drag-and-drop flows.

## 6. Drag-and-Drop Zones

Drop zone on the Card component:

- **Card-level** (the skill list): drops trigger the import flow (with overwrite check)

Visual feedback: `ring-2 ring-primary ring-offset-2` on the drop target, with a dashed border overlay showing "Drop SKILL.md file here".

Handle `onDragLeave` carefully on the Card — check `e.currentTarget.contains(e.relatedTarget)` to avoid clearing the drag state when moving between child elements.

## 7. Provider Compatibility Notice

When a feature only works with specific LLM providers, show an informational `Alert` (not blocking) that:

- Names the supported providers
- Shows which provider the project currently uses
- Does NOT disable the feature — users can still set things up in advance

```tsx
const SUPPORTED_PROVIDERS = new Set(["openai", "anthropic"]);
const isSupported = !providerName || SUPPORTED_PROVIDERS.has(providerName);
```

## 8. Testing Patterns for Settings Components

- **SkillCard** (presentational): No mocks needed. Test rendering, click handlers, aria-labels directly.
- **SkillForm** (form with mutations): Mock `@/trpc/react` and `@/hooks/use-toast`. Use a `shouldFailWith` variable to toggle between success/error paths in the mock.
- **SkillsSection** (orchestrator): Mock `@tambo-ai/react` and `EditWithTamboButton`. Test list states, import flow, overwrite dialog, provider notice.
- **Frontmatter parser**: Pure function — no mocks. Test all edge cases including YAML special characters, Windows line endings, round-trip fidelity.
- **Drag-and-drop**: Skip in jsdom tests — `DragEvent`/`DataTransfer` are not properly supported. These need Playwright/e2e testing.
- **Mutation error paths**: Valuable to test — verify destructive toasts show correct messages for name conflicts.
