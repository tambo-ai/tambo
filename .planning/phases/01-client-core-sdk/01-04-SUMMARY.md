---
phase: 01-client-core-sdk
plan: 04
status: complete
duration: 8min
---

# Plan 01-04 Summary: SSE streaming with reconnection recovery

## What Changed

Added streaming run methods to ThreadsClient and comprehensive tests for the existing `streamEvents` SSE parser.

## Key Decisions

- **Kept existing streamEvents**: The custom SSE parser with reconnection/timeout/Last-Event-ID was already solid — no rewrite needed
- **Added SDK streaming methods**: `threads.run()` and `threads.createRun()` wrap SDK's `sdk.threads.runs.run()` and `sdk.threads.runs.create()` which return `Stream<RunRunResponse>`
- **Two streaming paths**: SDK streams for simple use (auto-parsed), `streamEvents` for custom SSE with reconnection (advanced use)

## Files Modified

- `packages/client-core/src/threads.ts` — Added `run()` and `createRun()` methods using SDK streaming with cache invalidation
- `packages/client-core/src/streaming.test.ts` — New: 8 tests covering SSE parsing, reconnection, Last-Event-ID, timeouts, cancellation, partial chunks, malformed JSON

## Verification

- `npm run check-types -w packages/client-core` — clean
- `npm run build -w packages/client-core` — dual CJS/ESM builds pass
- `npm test -w packages/client-core` — 35 tests pass (5 suites)
