# Tambo Headless Primitives

## What This Is

Headless primitive migration and cleanup for the Tambo React SDK (`@tambo-ai/react-ui-base`) focused on core message primitives plus elicitation/message-input composability. Built on @base-ui/react's `useRender` pattern, with styled block orchestration in `@tambo-ai/ui-registry`.

## Core Value

Developers can build fully custom AI-powered UIs using Tambo primitives without fighting or overriding opinionated styling using as much or as little of the provided behavior as needed. Primitives are unstyled and follow a consistent API pattern, enabling maximum flexibility and composability.

## Execution Notes

- Phase 0 remains the documentation gate (`spec-phase-0.md` + `ui-feature-contract.md`).
- Phases 1-7 are now vertical slices: input/elicitation, timeline rendering, thread controls, block variants, apps/web adoption, docs/showcase adoption, and final stabilization.
- The phase sequence intentionally prioritizes end-to-end behavior slices over namespace-by-namespace migration passes.
- Base primitive docs are integrated into implementation slices (Phase 1 + Phase 2) using `spec-template-base-primitive-doc-page.md`; Phase 6 is docs IA/polish, not first-pass docs authoring.

## Requirements

### In Scope

- None of the ui-registry components or blocks use tambo specific hooks directly; they only compose primitives that use the hooks
- Existing base components should be refactored into headless primitives following the compound component pattern.
  - Message
  - ReasoningInfo
  - ToolcallInfo
  - MessageInput
- New primitives created in `react-ui-base`
- All primitives follow compound component pattern
- All primitives use @base-ui
  ```
  import { useRender } from "@base-ui/react/use-render";
  import { mergeProps } from "@base-ui/react/merge-props";
  ```
- Custom useRender hook and @radix-ui/react-slot removed
- ui-registry styled components consume react-ui-base primitives
- asChild removed entirely from react-ui-base components and all first-party consumers use render prop pattern
- Registry thread blocks (`message-thread-full`, `message-thread-panel`, `message-thread-collapsible`, `control-bar`) remain styled blocks with opinionated orchestration
- Default suggestions are caller-provided in registry blocks
- Base primitive docs pages follow Base UI-style structure (`Demo`, `Anatomy`, `Examples`, `API reference`) and are delivered with their corresponding implementation slices

### Out of Scope

- Styling or theming system — primitives are intentionally unstyled
- Breaking changes to react-sdk hooks/providers — primitives build on top of existing hooks
- New framework SDKs (Vue, Svelte, React Native PRs exist but are separate efforts)
- New base primitive domains for messge-thread-\* block UIs
- New base primitive domains for `map`, `form`, and `input-fields`
- Graph primitive — pure UI, no Tambo API dependency
- Map primitive — heavy third-party deps (Mapbox)

## Constraints

- **Pattern**: Must follow Base UI compound component pattern (useRender + render prop)
- **Package boundary**: Primitives live in react-ui-base, styled versions in ui-registry — no styling in primitives

## Key Decisions

| Decision                                         | Rationale                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Radix-style headless (no styling)                | Maximum flexibility for users building custom UIs                                      |
| Compound component namespace pattern             | Established pattern in existing react-ui-base, proven DX from Radix                    |
| Evaluate open PRs as attempts                    | PRs were bot/AI-generated and may not all be relevant or correct fresh implementations |
| Memoized context values                          | Prevent unnecessary re-renders in compound components                                  |
| Type alias over interface for render prop unions | TypeScript requires union types for render prop components                             |
| `useRender` hook for render prop pattern         | Consistent API across all primitives, handles both children and render prop            |
| `void` for fire-and-forget async                 | Clean pattern for non-blocking UI handlers (thread switching, etc.)                    |
| `render` prop (not children-as-function)         | Aligns with `useRender` hook implementation, proper TypeScript types                   |
| Migrate to @base-ui/react useRender (v1.1)       | Upstream-maintained, eliminates custom useRender + Radix Slot                          |
| Remove asChild entirely (v1.1)                   | Breaking cleanup is acceptable; render prop pattern is the only supported composition  |
| Thread blocks remain registry-owned              | They share Tambo behavior but are display-specific and should stay styled blocks       |
| Hotkeys remain opinionated in registry blocks    | Product-level UX choice with callback extensibility                                    |
| Keep `canvas-space` global event API             | Existing integration model relies on `tambo:showComponent`                             |
| Keep thread rename UI with TODO                  | UI remains; backend rename API wiring is deferred                                      |

---
