---
name: accessibility-checklist
description: >-
  Use this skill when creating, modifying, or reviewing any .tsx component in apps/web, even if
  the user doesn't mention "accessibility." Covers semantic HTML, aria labels, navigation landmarks,
  forms, dialogs, and keyboard navigation. Trigger on: adding buttons, links, toggles, icons, or
  any interactive element; building or editing forms; adding dialogs or modals; reviewing UI code.
  Includes inline verification patterns for scanning violations. Not for styling or layout changes
  that don't involve interactive elements.
metadata:
  internal: true
---

# Accessibility Checklist

Every UI component in `apps/web` must meet these standards. No partial compliance.

## Gotchas

- **`role="button"` divs may exist in the codebase** -- fix them when touching affected files. `<TableHead>` elements with `role="button"` for sortable columns are acceptable.
- **Nested interactive elements** -- when replacing a `<div role="button">` that contains a child `<button>` (e.g., a copy button inside a collapsible toggle), do not just swap the outer div to `<button>`. That creates invalid nested buttons. Instead, restructure into sibling elements: a toggle `<button>` and a separate action `<button>` side by side in a flex container.
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

## Verification

Scan `apps/web/components` for common violations. For each check, grep for the pattern and fix any matches found.

### Check 1: `role="button"` on non-button elements

Search for `role="button"` in `.tsx` files. Flag `<div` or `<span` elements with this attribute; they should be `<button>` or `<Button>` instead. `<TableHead>` elements with `role="button"` for sortable columns are acceptable.

**Pattern:** `role="button"`

### Check 2: `<div onClick>` patterns

Search for `<div` elements with `onClick` handlers. These should use `<button>` instead for proper keyboard support.

**Pattern:** `<div[^>]*onClick`

### Check 3: Positive tabIndex values

Search for `tabIndex` with values greater than 0. Only `tabIndex={0}` and `tabIndex={-1}` are allowed.

**Pattern:** `tabIndex={[1-9]`

### Check 4: Icon buttons missing aria-label

Search for `size="icon"` in `.tsx` files. For each match, check surrounding lines (5-10 above and below) for `aria-label` on the same `<Button>` element or an `sr-only` span. Flag buttons that have neither.

**Pattern:** `size="icon"` without nearby `aria-label`

### Manual checks

These cannot be detected by pattern matching:

- [ ] Form inputs have associated `<label>` elements
- [ ] Navigation groups use `<nav>` with unique `aria-label`
- [ ] Dialogs use Radix-based components (AlertDialog or Dialog)
- [ ] Focus outlines intact
