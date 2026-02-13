---
phase: 03-plan-generation
plan: 02
subsystem: plan-generation
tags: [llm-integration, api-orchestration, json-parsing, validation]
dependencies:
  requires: [01-client-core-sdk, 03-01]
  provides: [generatePlan-api]
  affects: []
tech-stack:
  added: []
  patterns: [tdd, streaming-callbacks, zod-validation, error-handling]
key-files:
  created:
    - cli/src/utils/plan-generation/json-extraction.ts
    - cli/src/utils/plan-generation/json-extraction.test.ts
    - cli/src/utils/plan-generation/index.ts
    - cli/src/utils/plan-generation/index.test.ts
  modified: []
decisions:
  - "Multiple fallback strategies for JSON extraction (markdown blocks, raw JSON, embedded JSON)"
  - "Non-global regex patterns to avoid stateful matching issues"
  - "Thread creation with metadata field (no title field in SDK)"
  - "Event casting pattern for accessing runtime streaming event fields"
  - "Re-export types and utilities from index for consumer convenience"
metrics:
  duration: 358
  completed: 2026-02-13
---

# Phase 03 Plan 02: Plan Generation Orchestrator

**One-liner:** End-to-end plan generation flow from ProjectAnalysis to validated InstallationPlan via Tambo API with streaming support

## What Was Built

### Task 1: JSON Extraction Utility (TDD)

**Commit:** b04ffbf5e

Created `cli/src/utils/plan-generation/json-extraction.ts`:

- `extractJsonFromResponse(text: string): unknown` with 5 fallback strategies
- Priority: markdown `json blocks → ` blocks → {...} objects → [...] arrays → raw text
- Clear error messages with truncated input (first 200 chars) for debugging
- 9 comprehensive tests covering all extraction paths and error cases

**Key Implementation Details:**

- Non-global regex patterns (`.exec()` instead of `.match()` with `/g`) to avoid stateful matching
- Try/catch around each JSON.parse attempt, falling through to next strategy
- Greedy matching for outermost braces/brackets to handle nested structures
- Descriptive error includes truncated text to help debug LLM output issues

### Task 2: generatePlan Orchestrator (TDD)

**Commit:** 68caf4665

Created `cli/src/utils/plan-generation/index.ts`:

- `generatePlan(options: GeneratePlanOptions): Promise<InstallationPlan>` - main orchestrator
- Full flow: createTamboClient → create thread → buildPlanPrompt → executeRun → extractJson → validate → return
- Streaming support: onProgress callback receives text deltas from TEXT_MESSAGE_CONTENT events
- Error handling: JSON extraction failures and Zod validation failures with descriptive messages
- Re-exports: InstallationPlan types, buildPlanPrompt, installationPlanSchema for consumer convenience

**Integration Points:**

- Uses `createTamboClient()` from `@tambo-ai/client-core` with apiKey and optional baseUrl
- Uses `client.threads.create()` with metadata field (SDK doesn't support title)
- Uses `buildPlanPrompt()` from prompt-builder.ts to construct LLM prompt
- Uses `executeRun()` from client-core for streaming API interaction
- Uses `extractJsonFromResponse()` to parse LLM text output
- Uses `installationPlanSchema.parse()` for runtime validation

**Test Coverage:**

- 9 tests: API client creation, thread creation, prompt passing, streaming callbacks, successful generation, JSON extraction errors, Zod validation errors, re-exports
- Mocks: `createTamboClient` and `executeRun` at module level via `jest.unstable_mockModule()`
- Real implementations: prompt-builder, schemas, json-extraction (integration coverage)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### 1. JSON Extraction Strategy Priority

**Decision:** Use 5 fallback strategies in strict priority order

**Rationale:**

- LLMs produce varied output formats (markdown, raw JSON, mixed text)
- Priority order optimizes for most common formats first
- Each strategy independent - failure in one doesn't affect next
- Clear debugging via truncated text in error messages

**Pattern:**

```typescript
// Try markdown json block
if (jsonBlockMatch) { try parse } catch { fall through }
// Try markdown code block
if (codeBlockMatch) { try parse } catch { fall through }
// Try JSON object
if (objectMatch) { try parse } catch { fall through }
// Try JSON array
if (arrayMatch) { try parse } catch { fall through }
// Try raw text
try parse catch { throw descriptive error }
```

### 2. Non-Global Regex Patterns

**Decision:** Use `.exec()` instead of `.match()` with `/g` flag

**Rationale:**

- Global flag creates stateful regex objects with persistent `lastIndex`
- Causes subtle bugs between calls (per AGENTS.md guidance)
- `.exec()` without `/g` is stateless and predictable
- Linter auto-converted `.match()` to `.exec()` during commit

### 3. Thread Creation Metadata Field

**Decision:** Use `metadata: { purpose: "plan-generation" }` instead of `title`

**Rationale:**

- SDK ThreadCreateParams doesn't include title field (checked SDK types)
- metadata is the correct field for custom context
- Allows future filtering/querying of plan generation threads
- Tests confirmed { } (empty object) also valid for thread creation

### 4. Event Type Casting Pattern

**Decision:** Cast streaming events through unknown to access runtime fields

**Rationale:**

- SDK types RunRunResponse as `{ type: string; timestamp?: number }`
- Runtime SSE payloads include additional fields (delta, runId, etc)
- Cast pattern: `event as unknown as { type: string; delta?: string }`
- Matches pattern established in client-core/src/run.ts (StreamEventData interface)
- Safe at runtime, TypeScript-friendly

### 5. Re-Export Strategy

**Decision:** Re-export types and utilities from index.ts for convenience

**Rationale:**

- Consumer convenience: single import point for all plan-generation exports
- Types can't be runtime-validated (removed InstallationPlan from runtime re-export test)
- Functions (buildPlanPrompt) and schemas (installationPlanSchema) are runtime values
- Pattern: `export type { ... } from "./types.js"` for types, `export { ... }` for values

## Integration Points

**Upstream Dependencies:**

- `@tambo-ai/client-core` - createTamboClient, executeRun, streaming infrastructure
- `03-01` - installationPlanSchema, buildPlanPrompt, InstallationPlan types
- `zod` - runtime validation via installationPlanSchema.parse()

**Downstream Consumers:**

- Phase 4 (plan execution): will call generatePlan() to get InstallationPlan
- CLI commands: will integrate generatePlan into init flow

## Test Results

**Plan-generation module:**

- 59 tests passed across 4 test suites
- json-extraction.test.ts: 9 tests
- index.test.ts: 9 tests
- schemas.test.ts: 30 tests (from 03-01)
- prompt-builder.test.ts: 11 tests (from 03-01)

**Full test suite:**

- tambo (CLI): 484 tests passed, 27 suites
- web: 171 tests passed (2 skipped), 20 suites
- No regressions

**Quality checks:**

- TypeScript: ✓ All types compile
- Lint: ✓ Clean (no errors)
- Coverage: Not measured (--no-coverage flag per plan)

## Files Changed

**Created (4 files):**

- `cli/src/utils/plan-generation/json-extraction.ts` (73 lines)
- `cli/src/utils/plan-generation/json-extraction.test.ts` (77 lines)
- `cli/src/utils/plan-generation/index.ts` (105 lines)
- `cli/src/utils/plan-generation/index.test.ts` (325 lines)

**Total:** 580 lines of production + test code

## Commits

1. **b04ffbf5e** - feat(03-02): implement JSON extraction from LLM responses
   - extractJsonFromResponse() with 5 fallback strategies
   - 9 comprehensive tests
   - Clear error messages with truncated input

2. **68caf4665** - feat(03-02): implement generatePlan orchestrator
   - generatePlan() end-to-end flow
   - Streaming support via onProgress
   - Error handling for JSON and validation failures
   - Re-exports for consumer convenience
   - 9 tests covering full integration

## Next Steps

**Immediate (Phase 3):**

- Phase 3 complete - both plans (03-01, 03-02) finished
- Ready for Phase 4: Plan Execution

**Phase 4 Preview:**

- Integrate generatePlan() into CLI init command
- Build plan execution engine (apply recommendations to codebase)
- Tool calls to modify files based on InstallationPlan
- Progress reporting during execution

## Self-Check: PASSED

**Created files verified:**

```bash
[✓] cli/src/utils/plan-generation/json-extraction.ts
[✓] cli/src/utils/plan-generation/json-extraction.test.ts
[✓] cli/src/utils/plan-generation/index.ts
[✓] cli/src/utils/plan-generation/index.test.ts
```

**Commits verified:**

```bash
[✓] b04ffbf5e - feat(03-02): implement JSON extraction from LLM responses
[✓] 68caf4665 - feat(03-02): implement generatePlan orchestrator
```

**Tests verified:**

```bash
[✓] All 59 plan-generation tests pass
[✓] Full test suite passes (no regressions)
[✓] TypeScript compiles without errors
[✓] Lint passes without errors
```
