# Template: Base Primitive Docs Page (Base UI-Style)

**Purpose**: Use this template for every base primitive page in the docs site so each page mirrors the structure and scanning behavior of Base UI component pages (`Demo` -> `Anatomy` -> `Examples` -> `API reference`).

## Target Files

- `docs/content/docs/reference/react-ui-base-primitives/<primitive>.mdx`
- `docs/content/docs/reference/react-ui-base-primitives/meta.json` (page registration)
- `docs/content/docs/reference/meta.json` (section registration, Phase 6 IA pass)

## Required Frontmatter

```mdx
---
title: <Primitive Name>
description: <One-sentence description of what the primitive does>
---
```

## Required Page Structure

1. `# <Primitive Name>` and short description.
2. `## Demo`
3. `### Tailwind`
4. `## Anatomy`
5. `## Examples`
6. `### <Example Name>` (repeat for 2+ examples)
7. `## API reference`
8. `### Root`, then part subsections in namespace export order
9. `## Accessibility`
10. `## Styling Hooks`

`CSS Modules` example sections are optional. Tailwind examples are required.

## Required Content Rules

- Document behavior ownership (`react-ui-base`) and styling ownership (`ui-registry`) explicitly.
- Use compound snippets that match current exported API surface exactly.
- Keep snippets short and copy/pasteable; avoid app-specific wrappers.
- Call out `keepMounted` and `data-hidden` semantics where relevant.
- Include fail-fast/context requirements when a part must be nested under Root.

## MDX Scaffold

````mdx
---
title: MessageInput
description: Compose text input, attachments, submit/stop controls, and elicitation mode with unstyled parts.
---

# MessageInput

Compose message authoring behavior using unstyled parts in `@tambo-ai/react-ui-base`.

## Demo

### Tailwind

```tsx
<MessageInput.Root>{/* canonical minimal composition */}</MessageInput.Root>
```
````

## Anatomy

```tsx
<MessageInput.Root>
  <MessageInput.Content />
  <MessageInput.Elicitation />
  <MessageInput.Error />
</MessageInput.Root>
```

## Examples

### Submit/Stop Visibility

```tsx
<MessageInput.SubmitButton keepMounted />
<MessageInput.StopButton keepMounted />
```

### With Attachments

```tsx
<MessageInput.Images>{/* ... */}</MessageInput.Images>
```

## API reference

### Root

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| ...  | ...  | ...     | ...         |

### SubmitButton

| Prop        | Type    | Default | Description                                       |
| ----------- | ------- | ------- | ------------------------------------------------- |
| keepMounted | boolean | false   | Keeps the node mounted and toggles `data-hidden`. |

## Accessibility

- Keyboard behavior:
- ARIA semantics:
- Consumer responsibilities:

## Styling Hooks

- `data-slot`
- `data-state`
- `data-hidden`

```

## Definition of Done Checklist

- [ ] Page uses the required heading structure (`Demo`, `Anatomy`, `Examples`, `API reference`).
- [ ] Demo + Anatomy snippets compile with current exported APIs.
- [ ] API tables reflect current TypeScript signatures.
- [ ] Accessibility and styling-hook sections are complete.
- [ ] Related primitive links are included when composition crosses primitive domains.
```
