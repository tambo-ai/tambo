---
phase: 06-cli-integration
plan: 02
subsystem: cli
tags: [magic-init, cli-flags, command-routing, user-experience]
dependency_graph:
  requires:
    - 06-01 (magic-init orchestrator)
  provides:
    - --magic flag in CLI interface
    - init command routing to magic init
    - suggestion tip after normal init
  affects:
    - User experience for magic init workflow
tech_stack:
  added: []
  patterns:
    - CLI flag pass-through pattern
    - Post-init suggestion tips
    - Existing setup detection via filesystem checks
key_files:
  created: []
  modified:
    - cli/src/cli.ts
    - cli/src/commands/init.ts
    - cli/src/commands/init.test.ts
decisions:
  - Check for TamboProvider in layout files and tambo.ts in lib directories to detect existing magic setup
  - Show suggestion tip only when magic setup doesn't exist (avoids nagging users who already ran it)
  - Added cross-spawn and magic-init mocks to init.test.ts for Jest ESM compatibility
metrics:
  duration: 214
  completed_date: 2026-02-16
---

# Phase 06 Plan 02: CLI Flag Wiring Summary

Wired `--magic` flag into CLI entry point and init command with routing logic, suggestion tip, and existing setup detection.

## Performance

- **Duration:** 3 min 34 sec
- **Started:** 2026-02-16T20:02:34Z
- **Completed:** 2026-02-16T20:06:08Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Added `--magic` flag to CLI with "Run intelligent auto-configuration" description
- Wired flag through to handleInit and routed to handleMagicInit after basic init
- Added suggestion tip to run `tambo init --magic` when magic setup not detected
- Implemented detection of existing magic setup (TamboProvider in layout, tambo.ts in lib)
- Fixed test mocks to support new imports (cross-spawn, magic-init)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add --magic flag to CLI and wire into init command** - `0bf686da6` (feat)

## Files Created/Modified

- `cli/src/cli.ts` - Added magic flag to CLIFlags interface, meow flags definition, OPTION_DOCS, init command help examples, and pass-through to handleInit
- `cli/src/commands/init.ts` - Added magic to InitOptions, imported handleMagicInit, added routing logic after basic init completion, and existing setup detection
- `cli/src/commands/init.test.ts` - Added mocks for cross-spawn and magic-init module to support new imports

## Decisions Made

1. **Existing setup detection via filesystem checks:** Check for TamboProvider in common layout paths (src/app/layout.tsx, app/layout.tsx, etc.) and tambo.ts in lib directories. This provides fast, deterministic detection without needing a separate state file.

2. **Conditional suggestion tip:** Only show "Run tambo init --magic" tip when magic setup doesn't exist. This avoids nagging users who've already run magic init.

3. **Test mock additions:** Added cross-spawn mock (used by interactive.ts which magic-init imports) and magic-init module mock to init.test.ts. Integration-style testing approach matches Phase 5 patterns.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Jest ESM module compatibility issue:**

- **Problem:** init.test.ts failed with "spawn is not exported" error after adding magic-init import (which transitively imports interactive.ts → cross-spawn)
- **Resolution:** Added mock for cross-spawn module and magic-init module to test setup
- **Verification:** All 580 tests pass

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CLI flag wiring complete
- `tambo init --magic` command fully functional
- All existing tests pass (580 tests)
- Ready for end-to-end testing and documentation

---

_Phase: 06-cli-integration_
_Completed: 2026-02-16_
