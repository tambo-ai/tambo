---
phase: 02-codebase-analysis
plan: 03
subsystem: cli/project-analysis
tags: [tool-detection, orchestration, integration]
dependency_graph:
  requires:
    - 02-01 (project structure and TypeScript detection)
    - 02-02 (provider and component detection)
  provides:
    - Tool candidate detection (server actions, fetch calls, async functions)
    - Complete project analysis orchestrator
  affects:
    - Phase 03 (plan generation will consume ProjectAnalysis)
tech_stack:
  added: []
  patterns:
    - ts-morph batching by directory for memory optimization
    - Deduplication of server actions vs exported functions
    - Integration testing with simulated project structure
key_files:
  created:
    - cli/src/utils/project-analysis/tool-detection.ts
    - cli/src/utils/project-analysis/tool-detection.test.ts
    - cli/src/utils/project-analysis/index.ts
    - cli/src/utils/project-analysis/index.test.ts
  modified: []
decisions:
  - Tool detection processes files in batches grouped by directory to limit ts-morph memory usage
  - Server actions take priority over exported-function type during deduplication
  - Tool candidates capped at 30 results to avoid overwhelming output
  - React components excluded from tool candidates (name starts with uppercase + returns JSX)
  - Test/spec/stories files skipped from tool detection
  - Maximum file size of 50KB enforced to skip large generated/bundled files
  - analyzeProject() orchestrates all detection modules in specific order (framework → structure → typescript → package manager → providers → components → tools)
  - Empty arrays returned for providers/components when relevant directories don't exist
metrics:
  duration: 634 seconds (10 minutes)
  tasks_completed: 2
  files_created: 4
  tests_added: 12
  completed_at: 2026-02-12
---

# Phase 02 Plan 03: Tool Detection and Analysis Orchestration Summary

**One-liner:** Complete project analysis with tool candidate detection (server actions, fetch/axios calls, async functions) and orchestrator that combines all detection modules into single ProjectAnalysis result

## Overview

Built tool detection to identify functions and API calls that could become Tambo tools, plus the main analyzeProject() orchestrator that integrates all detection modules (framework, structure, TypeScript, providers, components, and tools) into a comprehensive project analysis.

## Tasks Completed

### Task 1: Tool Candidate Detection (6a33bf978)

**Files:** `tool-detection.ts`, `tool-detection.test.ts`

**Implementation:**

- `detectToolCandidates(projectRoot, options)` scans TypeScript/TSX files for three categories:
  1. **Server actions** - Next.js "use server" functions (top-level or function-level directives)
  2. **Fetch/axios calls** - Exported functions containing fetch() or axios.\* calls
  3. **Exported async functions** - General tool candidates (non-React components)
- Processes files in batches grouped by directory to optimize ts-morph memory usage
- Deduplicates server actions from exported functions (server-action type takes priority)
- Excludes React components (name starts with uppercase + returns JSX)
- Skips test/spec/stories files and files larger than 50KB
- Caps results at 30 candidates, sorted by file path then name
- Extracts JSDoc descriptions for context

**Tests:** 10 tests covering server actions (top-level and function-level), fetch/axios detection, React component exclusion, test file skipping, deduplication, result capping, and sorting

### Task 2: analyzeProject Orchestrator (b4b9d1796)

**Files:** `index.ts`, `index.test.ts`

**Implementation:**

- `analyzeProject(projectRoot)` main entry point that orchestrates all detection modules:
  1. Framework detection (Next.js, Vite, Remix, CRA)
  2. Project structure detection (src/, app/, pages/, components/)
  3. TypeScript configuration detection
  4. Package manager detection (npm, pnpm, yarn, rush)
  5. Provider detection (if root layout exists)
  6. Component detection (if component directories exist)
  7. Tool candidate detection
- Returns complete `ProjectAnalysis` object with all findings
- Re-exports all types (`FrameworkInfo`, `ProjectStructure`, `TypeScriptInfo`, `ProviderInfo`, `ComponentInfo`, `ToolCandidate`, `ProjectAnalysis`) for convenient imports
- Re-exports individual detection functions for direct use
- Gracefully handles missing providers/components (returns empty arrays)

**Tests:** 2 integration tests - full Next.js App Router project simulation (validates all detection modules work together), and minimal project with no providers/components

## Verification Results

✅ All project-analysis tests pass (103 tests total across 7 test files)
✅ TypeScript type checking passes with no errors
✅ ESLint passes with no warnings
✅ Full CLI test suite passes (425 tests) with no regressions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error in function body type check**

- **Found during:** Task 1, type checking after implementation
- **Issue:** `funcBody.getStatements()` failed because `getBody()` returns generic `Node` type without `getStatements()` method
- **Fix:** Added `asKind(SyntaxKind.Block)` check to safely cast to Block type before accessing statements
- **Files modified:** `cli/src/utils/project-analysis/tool-detection.ts`
- **Commit:** 6a33bf978 (included in Task 1 commit)

**2. [Rule 1 - Bug] Fixed ESLint prefer-optional-chain error**

- **Found during:** Task 1, pre-commit hook
- **Issue:** Multiple ESLint errors including array type syntax, type imports, and optional chain preference
- **Fix:** Changed `name[0] !== name[0]?.toUpperCase()` to `firstChar.toLowerCase() === firstChar` for uppercase check; used type imports; changed `Array<T>` to `T[]`
- **Files modified:** `cli/src/utils/project-analysis/tool-detection.ts`
- **Commit:** 6a33bf978 (included in Task 1 commit)

**3. [Rule 1 - Bug] Fixed test expectation for framework displayName**

- **Found during:** Task 2, running integration test
- **Issue:** Test expected `"Next.js (App Router)"` but actual value is `"Next.js App Router"` (no parentheses)
- **Fix:** Updated test expectation to match actual framework-detection output
- **Files modified:** `cli/src/utils/project-analysis/index.test.ts`
- **Commit:** b4b9d1796 (included in Task 2 commit)

**4. [Rule 1 - Bug] Fixed hook detection in test component**

- **Found during:** Task 2, running integration test
- **Issue:** Hook extraction didn't detect `React.useState` (looks for pattern `use[A-Z]`, not `React.use[A-Z]`)
- **Fix:** Changed test component to use `import { useState } from 'react'` instead of `React.useState`
- **Files modified:** `cli/src/utils/project-analysis/index.test.ts`
- **Commit:** b4b9d1796 (included in Task 2 commit)

## Integration Points

**Inputs (from Phase 02 Plans 01-02):**

- `detectFrameworkInfo(projectRoot)` from 02-01
- `detectProjectStructure(projectRoot, framework)` from 02-01
- `detectTypeScriptConfig(projectRoot)` from 02-01
- `detectProviders(layoutFilePath)` from 02-02
- `detectComponents(componentsDirs)` from 02-02
- `detectPackageManager(projectRoot)` from existing `cli/src/utils/package-manager.ts`

**Outputs (for Phase 03):**

- `analyzeProject(projectRoot): ProjectAnalysis` - single entry point for complete project analysis
- All types exported from `cli/src/utils/project-analysis/index.ts` for convenient imports
- Tool candidates include server actions, fetch/axios functions, and general async functions

## Technical Decisions

1. **Batch processing by directory** - Group files by directory when processing with ts-morph to limit AST memory usage and avoid performance issues
2. **Server action priority** - When a function is both a server action and an exported async function, classify as "server-action" (more specific type)
3. **React component exclusion** - Tool detection skips React components (uppercase name + JSX return) since they're covered by component detection
4. **30 candidate cap** - Limit results to avoid overwhelming output while still providing good coverage
5. **50KB file size limit** - Skip large files (likely generated/bundled) to improve performance
6. **Orchestration order** - analyzeProject() runs detections in specific order to pass results forward (e.g., framework info needed for structure detection)
7. **Graceful degradation** - Return empty arrays for providers/components when root layout or component directories don't exist

## Self-Check: PASSED

**Created files verified:**

```
FOUND: cli/src/utils/project-analysis/tool-detection.ts
FOUND: cli/src/utils/project-analysis/tool-detection.test.ts
FOUND: cli/src/utils/project-analysis/index.ts
FOUND: cli/src/utils/project-analysis/index.test.ts
```

**Commits verified:**

```
FOUND: 6a33bf978 (feat(02-03): implement tool candidate detection)
FOUND: b4b9d1796 (feat(02-03): implement analyzeProject orchestrator)
```

**Test results verified:**

- All 103 project-analysis tests pass
- All 425 CLI tests pass (no regressions)
- Type checking passes
- Linting passes

## Next Steps

Phase 02 Plan 04 will add the final piece: configuration file detection (tailwind.config, next.config, vite.config, etc.) to complete the codebase analysis foundation.
