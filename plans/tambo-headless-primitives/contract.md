# Tambo Headless Primitives Contract

**Created**: 2026-02-19
**Updated**: 2026-02-20
**Confidence Score**: 97/100
**Status**: Draft

## Problem Statement

`@tambo-ai/react-ui-base` currently mixes headless behavior with legacy composition mechanics (`asChild`, Radix Slot, custom `useRender`) and does not yet fully model the desired MessageInput + elicitation composition. This creates inconsistent APIs between primitives and forces styled components in `@tambo-ai/ui-registry` to retain coupling to old patterns.

Developers building custom Tambo UIs need stable, unstyled primitives that are behavior-complete and consistently composable. Without this, they either fork first-party components or layer heavy overrides on top of implementation details.

## Goals

1. Migrate base primitives to a consistent Base UI render pattern (`useRender` + `mergeProps`) with compound component namespaces.
2. Refactor existing primitives (`Message`, `ReasoningInfo`, `ToolcallInfo`, `MessageInput`) to use the new pattern and remove first-party `asChild` usage.
3. Add a dedicated base elicitation primitive and make input-vs-elicitation mode switching a base responsibility.
4. Keep thread blocks (`message-thread-full`, `message-thread-panel`, `message-thread-collapsible`, `control-bar`) as styled registry blocks with opinionated orchestration and hotkeys.
5. Keep ready-to-use UI components (`map`, `form`, `input-fields`) as registry components (no base primitive extraction requirement).
6. Allow intentional breaking API cleanup in `react-ui-base` to fully remove legacy `asChild` and Slot patterns while keeping primitives unstyled.
7. Add docs reference pages for base primitives in the docs site using a consistent Base UI-style page structure.
8. Ship primitive docs with the same implementation slices that introduce/modify those primitives (not as a late follow-up).

## Success Criteria

- [ ] `packages/react-ui-base` no longer depends on `@radix-ui/react-slot` and no internal custom render helper remains.
- [ ] Existing base primitive namespaces plus the new elicitation primitive follow a consistent compound pattern.
- [ ] First-party consumers in `packages/ui-registry` use render prop composition for base primitives and do not rely on `asChild` from `react-ui-base`.
- [ ] `MessageInput` composition supports separate submit/stop controls with `keepMounted` + `data-hidden` semantics.
- [ ] Default suggestions are caller-provided in registry blocks, not hardcoded component defaults.
- [ ] Existing tests for `packages/react-ui-base` and `packages/ui-registry` pass, with added/updated tests covering new primitive behavior.
- [ ] No new styling concerns are introduced into `react-ui-base`; styles stay in `ui-registry`.
- [ ] Base primitive reference docs exist for `message-input`, `elicitation`, `message`, `toolcall-info`, and `reasoning-info`, and follow the shared page template.
- [ ] Primitive docs land in the same delivery slices as implementation work (Phase 1: input+elicitation pages, Phase 2: timeline pages), with Phase 6 reserved for docs IA and consistency polish.

## Scope Boundaries

### In Scope

- Base primitive migration for `Message`, `ReasoningInfo`, `ToolcallInfo`, `MessageInput`.
- New headless elicitation primitive in `react-ui-base`.
- Base-managed mode switching between message input content and elicitation UI.
- `ui-registry` updates to consume migrated/new base primitives.
- Compound namespace consistency and render prop API consistency.
- Registry block updates for caller-provided suggestions and opinionated hotkey behavior.
- Docs reference updates for base primitives in `docs/content/docs/reference`.
- Docs template enforcement for Base UI-style heading structure (`Demo`, `Anatomy`, `Examples`, `API reference`).

### Out of Scope

- Styling/theming system changes in base primitives.
- Breaking changes to `@tambo-ai/react` hooks/providers.
- New framework SDK work (Vue/Svelte/React Native).
- Base primitive extraction for thread block UIs (`message-thread-*`, `control-bar`).
- Base primitive extraction for `map`, `form`, `input-fields`.
- Graph primitive migration (pure UI).
- Map primitive migration (third-party dependency-heavy).

### Future Considerations

- Migration notes for downstream consumers adopting render-prop composition.
- Additional primitive coverage for non-Tambo UI helpers if needed by downstream consumers.
- Performance instrumentation for primitive-level re-render diagnostics.

## Assumptions

- `asChild` is removed outright from `react-ui-base`; no compatibility shim or deprecation bridge is required.
- Existing package boundaries remain unchanged (`react-ui-base` for behavior, `ui-registry` for style/composition).
- Registry block components are allowed to keep orchestration state and opinionated hotkeys.
- `canvas-space` keeps the global `tambo:showComponent` event API.
- `thread-history` keeps rename UI, with a TODO to wire rename API when backend support exists.

---

_This contract was generated from `.planning/PROJECT.md` plus codebase exploration of `packages/react-ui-base` and `packages/ui-registry`._
