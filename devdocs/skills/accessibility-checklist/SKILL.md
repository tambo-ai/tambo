---
name: accessibility-checklist
description: >-
  Enforce accessibility standards for UI components in apps/web. Covers semantic HTML, aria labels,
  navigation landmarks, forms, dialogs, and keyboard navigation. Use when: (1) creating or modifying
  any .tsx component in apps/web, (2) adding interactive elements (buttons, links, toggles, dialogs),
  (3) building forms or data entry flows, (4) reviewing UI code for accessibility.
metadata:
  internal: true
---

# Accessibility Checklist

Every UI component in `apps/web` must meet these standards. No partial compliance.

## Semantic HTML

Use native elements. Never recreate `<button>` behavior with `<div role="button">` + keyboard handlers.

| Interaction      | Element                                                |
| ---------------- | ------------------------------------------------------ |
| Clickable action | `<button>` or `<Button>` from `@/components/ui/button` |
| Navigation link  | `<Link>` (Next.js) or `<a>`                            |
| Navigation group | `<nav>` with descriptive `aria-label`                  |
| Item list        | `<ul>`/`<ol>` + `<li>`                                 |
| Section heading  | `<h1>`-`<h6>` in order, never skip levels              |

**Known violations to fix when touching these files:**

- `apps/web/components/observability/thread-table/thread-table-header.tsx` -- 7 `role="button"` divs
- `apps/web/components/observability/messages/tool-response-section.tsx` -- `role="button"` div
- `apps/web/components/observability/messages/tool-arguments-section.tsx` -- `role="button"` div

## Aria Labels

Every interactive element without visible text needs `aria-label` with both action AND target:

```tsx
<Button size="icon" aria-label={`Delete API key ${keyName}`}>
  <Trash2 className="h-4 w-4" />
</Button>

<Switch aria-label={`${enabled ? "Disable" : "Enable"} skill ${skillName}`} />
```

Prefer state-aware labels ("Copied!" vs "Copy"). Buttons with visible text skip `aria-label`.

**Reference implementations:**

- `apps/web/components/copy-button.tsx` -- state-aware label
- `apps/web/components/ui/tambo/context-attachment-badge.tsx` -- contextual remove label
- `apps/web/components/observability/thread-table/thread-table-header.tsx` -- sort state label

## Navigation Landmarks

Wrap navigation groups in `<nav>` with a unique `aria-label` per region on the page. Breadcrumbs already correct in `apps/web/components/ui/breadcrumb.tsx`.

## Screen Reader Text

Use `sr-only` class for text visible only to screen readers: icon-only button labels, loading indicators, visual-only status indicators.

## Forms

Use the project's react-hook-form + shadcn Form pattern. Import from `@/components/ui/form`:

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        <Input placeholder="..." {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

This handles ID generation, label association, `aria-describedby`, and `aria-invalid` automatically. For standalone inputs outside react-hook-form, pair `useId()` with `htmlFor`/`id`. Never use placeholder as label substitute.

## Dialogs

Use Radix-based components from `@/components/ui/`. Always include `AlertDialogTitle` and `AlertDialogDescription`. Never build custom modal/overlay patterns.

## Keyboard Navigation

- All interactive elements reachable via Tab
- Only `tabIndex={0}` or `tabIndex={-1}` (never positive values)
- Never remove focus outlines (`focus-visible:ring-2 focus-visible:ring-ring` from Button)
- Prefer `<button>` over manual Enter/Space handlers

## Pre-Submit Checklist

- [ ] Clickable elements use `<button>` or `<a>`, not `<div onClick>`
- [ ] Icon-only buttons have descriptive `aria-label` with context
- [ ] Form inputs have associated `<label>` elements
- [ ] Navigation groups use `<nav>` with unique `aria-label`
- [ ] Dialogs use Radix-based components
- [ ] Focus outlines intact
- [ ] Interactive elements keyboard-reachable
