---
status: testing
phase: 06-cli-integration
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md]
started: 2026-02-16T20:15:00Z
updated: 2026-02-16T20:15:00Z
---

## Current Test

number: 3
name: Normal init suggests --magic afterward
expected: |
Running `tambo init` (without --magic) on a project that doesn't have TamboProvider configured shows a tip after init completes.
awaiting: user response

## Tests

### 1. --magic flag appears in CLI help

expected: Running `npx tambo init --help` shows `--magic` flag with description "Run intelligent auto-configuration"
result: pass

### 2. tambo init --magic triggers full pipeline

expected: Running `tambo init --magic` in a Next.js project with API key configured runs analysis → plan generation → confirmation → execution. You should see progressive spinner updates during analysis ("Detecting framework...", "Detecting components...", "Finding tools..."), then an analysis summary, then a confirmation checklist, then execution.
result: issue
reported: "Analysis works but plan generation fails with 400 V1 APIs require exactly one context identifier: provide either userKey (query/body) or an OAuth bearer token with a context key (received neither)."
severity: blocker

### 3. Normal init suggests --magic afterward

expected: Running `tambo init` (without --magic) on a project that doesn't have TamboProvider configured shows a tip: "Run tambo init --magic to auto-configure components based on your codebase" after initialization completes.
result: [pending]

### 4. --magic --yes runs non-interactively

expected: Running `tambo init --magic --yes` auto-approves high-confidence recommendations without interactive prompts. The pipeline completes without user input.
result: [pending]

### 5. Re-run detection skips existing setup

expected: Running `tambo init --magic` a second time on a project that already has TamboProvider in the layout and components registered in tambo.ts shows "Existing setup detected" and filters already-configured items from the plan.
result: [pending]

### 6. All existing CLI tests pass

expected: Running `npm test` from repo root shows all 580 tests passing, including the 13 new magic-init tests.
result: pass

### 7. Type checking passes

expected: Running `npm run check-types` passes with no errors.
result: pass

## Summary

total: 7
passed: 3
issues: 1
pending: 3
skipped: 0

## Gaps

- truth: "tambo init --magic runs full pipeline through plan generation, confirmation, and execution"
  status: failed
  reason: "User reported: Analysis works but plan generation fails with 400 V1 APIs require exactly one context identifier: provide either userKey (query/body) or an OAuth bearer token with a context key (received neither)."
  severity: blocker
  test: 2
  root_cause: "The publishable API key (NEXT_PUBLIC_TAMBO_API_KEY) with userKey 'cli' should work for V1 thread/run APIs but the API rejects it with 'received neither'. Likely the SDK's threads.create sends userKey in the body but the V1 API middleware isn't parsing it from the body for publishable keys, or the publishable key type doesn't have the required permissions for thread creation."
  artifacts:
  - path: "cli/src/utils/plan-generation/index.ts"
    issue: "generatePlan creates client with userKey 'cli' but API rejects the request"
  - path: "packages/client-core/src/threads.ts"
    issue: "threads.create passes userKey in body via SDK, but API may need it as query param"
    missing:
  - "Investigate whether publishable API keys support thread creation, or if a secret key is required"
  - "Check if userKey needs to be sent as query param instead of body param for threads.create"
    debug_session: ""
