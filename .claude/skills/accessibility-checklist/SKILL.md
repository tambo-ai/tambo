---
name: accessibility-checklist
description: >-
  Use this skill when creating, modifying, or reviewing any .tsx component in apps/web, even if
  the user doesn't mention "accessibility." Covers semantic HTML, aria labels, navigation landmarks,
  forms, dialogs, and keyboard navigation. Trigger on: adding buttons, links, toggles, icons, or
  any interactive element; building or editing forms; adding dialogs or modals; reviewing UI code.
  Includes a scan script that finds violations automatically. Not for styling or layout changes
  that don't involve interactive elements.
metadata:
  internal: true
---

# Accessibility Checklist

Every UI component in `apps/web` must meet these standards. No partial compliance.

## Available scripts

- **`scripts/scan-a11y.sh`** -- scans `apps/web/components` for common a11y violations (role="button" divs, div onClick, positive tabIndex, icon buttons missing aria-label). Run from repo root:

```bash
bash devdocs/skills/accessibility-checklist/scripts/scan-a11y.sh
```

## Gotchas

- **`role="button"` divs exist in the codebase** -- fix them when touching these files (all in `apps/web/components/observability/`):
  - `thread-table-header.tsx` (7 instances), `tool-response-section.tsx`, `tool-arguments-section.tsx`
  - Also in `apps/web/components/ui/tambo/message-thread-panel.tsx`
- **Standalone inputs outside react-hook-form need manual ID pairing** -- use `useId()` with `htmlFor`/`id`. The shadcn `<FormField>` handles this automatically, but raw `<Input>` does not.
- **AlertDialog vs Dialog** -- use `AlertDialog` for destructive confirmations (requires `AlertDialogTitle` + `AlertDialogDescription`). Use `Dialog` for content/forms. Never build custom modal overlays.
- **Icon-only buttons without `aria-label`** are common in new code. Every icon-only button needs one, and it must include context: `Delete API key ${keyName}`, not just "Delete".

## Semantic HTML

Use native elements. Never recreate `<button>` behavior with `<div role="button">` + keyboard handlers.

| Interaction      | Element                                                |
| ---------------- | ------------------------------------------------------ |
| Clickable action | `<button>` or `<Button>` from `@/components/ui/button` |
| Navigation link  | `<Link>` (Next.js) or `<a>`                            |
| Navigation group | `<nav>` with descriptive `aria-label`                  |
| Item list        | `<ul>`/`<ol>` + `<li>`                                 |
| Section heading  | `<h1>`-`<h6>` in order, never skip levels              |

## Aria Labels

Every interactive element without visible text needs `aria-label` with both action AND target:

```tsx
<Button size="icon" aria-label={`Delete API key ${keyName}`}>
  <Trash2 className="h-4 w-4" />
</Button>

<Switch aria-label={`${enabled ? "Disable" : "Enable"} skill ${skillName}`} />
```

Prefer state-aware labels ("Copied!" vs "Copy"). Buttons with visible text skip `aria-label`.

**Reference implementations:** `copy-button.tsx` (state-aware), `context-attachment-badge.tsx` (contextual remove), `thread-table-header.tsx` (sort state) -- all in `apps/web/components/`.

## Navigation Landmarks

Wrap navigation groups in `<nav>` with a unique `aria-label` per region on the page.

## Forms

Use shadcn Form components from `@/components/ui/form` (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`). They handle ID generation, label association, `aria-describedby`, and `aria-invalid` automatically.

For standalone inputs outside react-hook-form, pair `useId()` with `htmlFor`/`id`. Never use placeholder as label substitute.

## Keyboard Navigation

- Only `tabIndex={0}` or `tabIndex={-1}` (never positive values)
- Never remove focus outlines
- Prefer `<button>` over manual Enter/Space handlers

## Validation

1. Run the scan script:

   ```bash
   bash devdocs/skills/accessibility-checklist/scripts/scan-a11y.sh
   ```

2. If violations are found, fix them.
3. Re-run until the script exits clean.
4. Manually verify items the script cannot check:
   - [ ] Form inputs have associated `<label>` elements
   - [ ] Navigation groups use `<nav>` with unique `aria-label`
   - [ ] Dialogs use Radix-based components (AlertDialog or Dialog)
   - [ ] Focus outlines intact
