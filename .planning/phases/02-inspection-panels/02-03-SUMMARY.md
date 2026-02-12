---
phase: 02-inspection-panels
plan: 03
subsystem: devtools
tags: [react, shadcn, filtering, search, registry, error-display]

requires:
  - phase: 02-inspection-panels
    provides: Enriched snapshot with registry, threads, errors

provides:
  - Registry panel showing components, tools, MCP servers with schema inspection
  - Error banner surfacing streaming/tool/connection errors
  - Filter bar with thread status, message role/type, and search
  - useDevtoolsFilters hook for filter state management

affects: [03-streaming-visibility]

tech-stack:
  added: []
  patterns:
    [
      debounced search input with local state,
      derived snapshot types for filter compatibility,
      tabbed Inspector/Registry layout,
    ]

key-files:
  created:
    - apps/web/app/(authed)/devtools/components/registry-panel.tsx
    - apps/web/app/(authed)/devtools/components/schema-viewer.tsx
    - apps/web/app/(authed)/devtools/components/error-banner.tsx
    - apps/web/app/(authed)/devtools/components/filter-bar.tsx
    - apps/web/app/(authed)/devtools/hooks/use-devtools-filters.ts
  modified:
    - apps/web/app/(authed)/devtools/page.tsx

key-decisions:
  - "Derived SnapshotMessage type from StateSnapshot rather than exporting internal types from types.ts"
  - "200ms debounce on search input to avoid excessive re-filtering"

patterns-established:
  - "Derived types from snapshot: use StateSnapshot['threads'][number] to avoid type drift"

duration: 4min
completed: 2026-02-12
---

# Phase 2 Plan 3: Registry Panel, Error Banner, and Filtering Summary

**Tabbed registry panel with component/tool/MCP inspection, error banner, and thread/message filtering with debounced search**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T13:27:28Z
- **Completed:** 2026-02-12T13:31:58Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Registry panel with Components/Tools/MCP Servers tabs, accordion schema inspection via SchemaViewer
- Error banner with type badges, timestamps, and collapsible overflow
- Filter bar with thread status, message role, content type selects and debounced search
- Page integrated with Inspector/Registry tabs, error banner, and filter bar wired to filtered data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create registry panel, schema viewer, and error banner** - `8243ca4ea` (feat)
2. **Task 2: Create filter bar, search, and integrate all panels into page** - `625d18bd4` (feat)

## Files Created/Modified

- `apps/web/app/(authed)/devtools/components/schema-viewer.tsx` - Renders JSON Schema properties as readable rows
- `apps/web/app/(authed)/devtools/components/registry-panel.tsx` - Tabbed view of components, tools, MCP servers
- `apps/web/app/(authed)/devtools/components/error-banner.tsx` - Prominent error display with expand/collapse
- `apps/web/app/(authed)/devtools/components/filter-bar.tsx` - Horizontal filter selects and search input
- `apps/web/app/(authed)/devtools/hooks/use-devtools-filters.ts` - Filter state and memoized filtering logic
- `apps/web/app/(authed)/devtools/page.tsx` - Integrated all new components into page layout

## Decisions Made

- Derived SnapshotMessage type from StateSnapshot['threads'][number]['messages'][number] rather than exporting internal serialized types -- avoids expanding the public API of types.ts
- Used 200ms debounce on search to balance responsiveness with performance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed type incompatibility in useDevtoolsFilters**

- **Found during:** Task 2 (type checking)
- **Issue:** Local SerializedContent/SerializedMessage types were structurally incompatible with StateSnapshot's discriminated union content types
- **Fix:** Derived SnapshotMessage and SnapshotThread types from StateSnapshot instead of defining local interfaces
- **Files modified:** apps/web/app/(authed)/devtools/hooks/use-devtools-filters.ts
- **Verification:** npm run check-types passes
- **Committed in:** 625d18bd4

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type fix necessary for correctness. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All inspection panels complete: thread inspector (Plan 02), registry viewer, error banner, filtering
- Ready for Phase 3 (Streaming Visibility) which will add real-time streaming state views

---

_Phase: 02-inspection-panels_
_Completed: 2026-02-12_
