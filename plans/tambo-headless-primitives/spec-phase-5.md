# Implementation Spec: Tambo Headless Primitives - Phase 5 (Vertical Slice: MCP Prompt & Resource Picker Primitives)

**Contract**: ./contract.md
**Feature Contract**: ./ui-feature-contract.md
**Estimated Effort**: M

## Technical Approach

Extract MCP prompt and resource picker behavior from the styled `ui-registry` `mcp-components` into headless primitives in `react-ui-base`. The goal is to encapsulate all Tambo SDK hook usage (`useTamboMcpPromptList`, `useTamboMcpPrompt`, `useTamboMcpResourceList`) behind composable headless parts so registry consumers and external consumers never import `@tambo-ai/react/mcp` directly for picker UI.

The existing `react-ui-base` message-input already uses `useCombinedPromptList` / `useCombinedResourceList` internally — these new primitives complement that by providing standalone picker composition that works both inside and outside the message-input context.

## Scope

### In Scope

- Add `McpPrompts` headless primitive to `react-ui-base` (prompt list + select + fetch + validate lifecycle).
- Add `McpResources` headless primitive to `react-ui-base` (resource list + search/filter + select lifecycle).
- Refactor `ui-registry` `mcp-components` (`McpPromptButton`, `McpResourceButton`) to compose the new base primitives instead of calling SDK hooks directly.
- Author Base UI-style primitive docs pages for both primitives using `spec-template-base-primitive-doc-page.md`.

### Out of Scope

- Thread block variant layout orchestration (Phase 4 — complete).
- `apps/web` adoption (Phase 6).
- Canvas-space primitive extraction (rendered component display is already covered by `Message.RenderedComponent*` primitives).
- Changes to the internal `useCombinedPromptList` / `useCombinedResourceList` hooks in message-input (they already work correctly).

## File Changes

### New Files

| File Path                                                            | Changes                                                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/react-ui-base/src/mcp-prompts/index.tsx`                   | McpPrompts namespace export                                                        |
| `packages/react-ui-base/src/mcp-prompts/mcp-prompts-root.tsx`        | Root: calls `useTamboMcpPromptList`, owns selected prompt state, availability gate |
| `packages/react-ui-base/src/mcp-prompts/mcp-prompts-context.tsx`     | Context type + provider + `useMcpPromptsContext` guard hook                        |
| `packages/react-ui-base/src/mcp-prompts/mcp-prompts-trigger.tsx`     | Trigger: button element, enabled when prompts are available                        |
| `packages/react-ui-base/src/mcp-prompts/mcp-prompts-list.tsx`        | List: renders prompt items via render prop                                         |
| `packages/react-ui-base/src/mcp-prompts/mcp-prompts-item.tsx`        | Item: individual prompt, calls `onSelect` from context                             |
| `packages/react-ui-base/src/mcp-prompts/mcp-prompts-error.tsx`       | Error: renders when prompt fetch/validation fails                                  |
| `packages/react-ui-base/src/mcp-prompts/*.test.tsx`                  | Behavior + guard coverage for all parts                                            |
| `packages/react-ui-base/src/mcp-resources/index.tsx`                 | McpResources namespace export                                                      |
| `packages/react-ui-base/src/mcp-resources/mcp-resources-root.tsx`    | Root: calls `useTamboMcpResourceList`, owns search state, availability gate        |
| `packages/react-ui-base/src/mcp-resources/mcp-resources-context.tsx` | Context type + provider + `useMcpResourcesContext` guard hook                      |
| `packages/react-ui-base/src/mcp-resources/mcp-resources-trigger.tsx` | Trigger: button element, enabled when resources are available                      |
| `packages/react-ui-base/src/mcp-resources/mcp-resources-search.tsx`  | Search: filter input, updates search state in context                              |
| `packages/react-ui-base/src/mcp-resources/mcp-resources-list.tsx`    | List: renders filtered resource items via render prop                              |
| `packages/react-ui-base/src/mcp-resources/mcp-resources-item.tsx`    | Item: individual resource, fires `onSelect` from context                           |
| `packages/react-ui-base/src/mcp-resources/*.test.tsx`                | Behavior + guard coverage for all parts                                            |

### Modified Files

| File Path                                                                    | Changes                                                                                                     |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `packages/react-ui-base/src/index.ts`                                        | Export `McpPrompts` and `McpResources` namespaces                                                           |
| `packages/react-ui-base/package.json`                                        | Add `mcp-prompts` and `mcp-resources` subpath exports                                                       |
| `packages/ui-registry/src/components/mcp-components/mcp-components.tsx`      | Refactor `McpPromptButton` and `McpResourceButton` to compose base primitives; remove direct SDK hook calls |
| `packages/ui-registry/src/components/mcp-components/mcp-components.test.tsx` | Update tests for composition-based implementation                                                           |
| `docs/content/docs/reference/react-ui-base/mcp-prompts.mdx`                  | McpPrompts primitive docs page                                                                              |
| `docs/content/docs/reference/react-ui-base/mcp-resources.mdx`                | McpResources primitive docs page                                                                            |
| `docs/content/docs/reference/react-ui-base/meta.json`                        | Add mcp-prompts and mcp-resources docs pages to section order                                               |

## Implementation Details

### McpPrompts Primitive

1. **`McpPrompts.Root`** — Calls `useTamboMcpPromptList()` and `useTamboMcpPrompt()`. Manages the prompt selection lifecycle:
   - `idle` → user hasn't selected anything
   - `fetching` → selected a prompt, fetching its content
   - `error` → fetch failed or validation failed (invalid format, no text content)
   - `done` → prompt text extracted and available via `onInsertText` callback

   Exposes via context: `{ prompts, isLoading, selectedPrompt, status, error, select, insertedText }`.

   The `enabled` prop on `useRender` gates on prompt availability — renders nothing when no prompts exist.

   Accepts `onInsertText: (text: string) => void` prop for the caller to handle insertion.

2. **`McpPrompts.Trigger`** — Renders the trigger element. Exposes `{ hasPrompts, isLoading }` as render state. Uses `useRender` with `enabled: hasPrompts`.

3. **`McpPrompts.List`** — Iterates `prompts` from context. Render prop receives `{ prompts }` where each prompt has `{ name, description }`.

4. **`McpPrompts.Item`** — Wraps individual prompt. Calls `context.select(promptName)` on interaction. Exposes `{ name, description, isSelected }` as render state.

5. **`McpPrompts.Error`** — Renders when `status === "error"`. Exposes `{ error }` as render state. Uses `enabled: status === "error"`.

### McpResources Primitive

1. **`McpResources.Root`** — Calls `useTamboMcpResourceList(search)`. Manages search state internally. Exposes via context: `{ resources, isLoading, search, setSearch }`.

   The `enabled` prop on `useRender` gates on resource availability.

   Accepts `onSelectResource: (uri: string, label: string) => void` prop.

2. **`McpResources.Trigger`** — Renders trigger element. Exposes `{ hasResources, isLoading }`. Uses `enabled: hasResources`.

3. **`McpResources.Search`** — Renders as an input element. Wired to `setSearch` from context. Exposes `{ search }` as render state.

4. **`McpResources.List`** — Iterates filtered `resources` from context. Render prop receives `{ resources }` where each resource has `{ uri, name, description }`.

5. **`McpResources.Item`** — Wraps individual resource. Calls `context.onSelectResource(uri, label)` on interaction. Exposes `{ uri, name, description }` as render state.

### Registry Refactor

The existing `McpPromptButton` and `McpResourceButton` in `ui-registry/mcp-components` get refactored to compose the base primitives:

```tsx
// Before: calls useTamboMcpPromptList() and useTamboMcpPrompt() directly
// After: composes McpPrompts parts with Radix DropdownMenu styling

<McpPrompts.Root onInsertText={handleInsert}>
  <DropdownMenu.Root>
    <McpPrompts.Trigger>
      {(state) => (
        <DropdownMenu.Trigger asChild>
          <button>{/* icon */}</button>
        </DropdownMenu.Trigger>
      )}
    </McpPrompts.Trigger>
    <DropdownMenu.Content>
      <McpPrompts.List>
        {({ prompts }) =>
          prompts.map((p) => (
            <McpPrompts.Item key={p.name} name={p.name}>
              {(state) => <DropdownMenu.Item>{state.name}</DropdownMenu.Item>}
            </McpPrompts.Item>
          ))
        }
      </McpPrompts.List>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <McpPrompts.Error>
    {({ error }) => <Tooltip content={error} />}
  </McpPrompts.Error>
</McpPrompts.Root>
```

### Pattern to Follow

- Existing primitives: `packages/react-ui-base/src/thread-history/` (list + search + item pattern)
- Existing primitives: `packages/react-ui-base/src/thread-content/` (state gate pattern)
- Context guard pattern: `packages/react-ui-base/src/message/message-context.ts`

### General Rules

1. All parts use `useRender` + `mergeProps` from `@base-ui/react`.
2. No styling in base primitives — data attributes only (`data-slot`, `data-state`, `data-loading`, `data-empty`).
3. Context guards throw descriptive errors when parts are used outside their Root.
4. Registry consumers retain all styling, Radix DropdownMenu usage, and icon choices.
5. Docs pages follow Base UI heading structure per `spec-template-base-primitive-doc-page.md`.

## Testing Requirements

### Unit Tests

| Test File                                                                    | Coverage                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/react-ui-base/src/mcp-prompts/*.test.tsx`                          | Availability gating, prompt selection lifecycle, error states, context guards        |
| `packages/react-ui-base/src/mcp-resources/*.test.tsx`                        | Availability gating, search/filter, selection, context guards                        |
| `packages/ui-registry/src/components/mcp-components/mcp-components.test.tsx` | Composition parity — verify buttons still render/hide correctly with base primitives |

### Manual Testing

- [ ] Validate prompt picker shows/hides based on MCP server prompt availability.
- [ ] Validate prompt selection → fetch → validate → insert lifecycle works end-to-end.
- [ ] Validate error state appears and auto-clears on prompt fetch failure.
- [ ] Validate resource picker shows/hides based on MCP server resource availability.
- [ ] Validate resource search filters the list correctly.
- [ ] Validate resource selection fires callback with correct URI and label.
- [ ] Validate both pickers work correctly within `MessageInput` toolbar context.
- [ ] Validate `mcp-prompts` and `mcp-resources` docs pages compile and match template structure.

## Validation Commands

```bash
npm run check-types -w packages/react-ui-base
npm run test -w packages/react-ui-base -- mcp-prompts mcp-resources
npm run check-types -w packages/ui-registry
npm run test -w packages/ui-registry -- mcp-components
npm run check-types -w docs
npm run lint -w docs
```

## Implementation Tracking

- **Current Status**: `Complete`
- **Implementation PR(s)**: `TBD`
- **Completion Date (YYYY-MM-DD)**: `2026-02-26`
- **Completion Notes**: `McpPrompts and McpResources headless primitives implemented. Registry mcp-components refactored to compose base primitives. Docs pages created.`
