---
phase: 01-client-core-sdk
plan: 03
status: complete
duration: 12min
---

# Plan 01-03 Summary: Refactor to typescript-sdk + TanStack query-core

## What Changed

Refactored client-core from raw fetch with custom retry logic to wrapping `@tambo-ai/typescript-sdk` for API calls and `@tanstack/query-core` for caching.

## Key Decisions

- **Functions over classes**: Used `createTamboClient()` and `createThreadsClient()` factory functions instead of classes, per user preference
- **ThreadsClient as sub-object**: Kept `client.threads.create()` style for ergonomic parity with the underlying SDK API
- **Query key factory pattern**: `threadKeys` provides hierarchical keys for granular cache invalidation
- **Cache invalidation on mutations**: `create` invalidates list cache; `delete` invalidates list + removes detail cache
- **SDK types re-exported**: Consumer gets SDK types through client-core without importing typescript-sdk directly

## Files Modified

- `packages/client-core/package.json` — Added `@tambo-ai/typescript-sdk` and `@tanstack/query-core` dependencies
- `packages/client-core/src/client.ts` — Replaced class with `createTamboClient()` function wrapping SDK + QueryClient
- `packages/client-core/src/threads.ts` — Replaced class with `createThreadsClient()` using SDK methods + query cache
- `packages/client-core/src/types.ts` — Simplified to TamboClientOptions + stream types + SDK type re-exports (removed old ApiError, RequestOptions, Thread, Message, ContentPart types)
- `packages/client-core/src/query.ts` — New: query key factories for cache management
- `packages/client-core/src/query.test.ts` — New: tests for query key hierarchy
- `packages/client-core/src/index.ts` — Updated exports: createTamboClient, createThreadsClient, threadKeys, SDK types, QueryClient
- `packages/client-core/src/client.test.ts` — Rewritten to test createTamboClient with mocked SDK
- `packages/client-core/src/threads.test.ts` — Rewritten to test SDK delegation + cache behavior
- `packages/client-core/src/retry.ts` — Updated ApiError → APIError import (from SDK)
- `packages/client-core/src/retry.test.ts` — Updated to use SDK's APIError

## Verification

- `npm run check-types -w packages/client-core` — clean
- `npm run build -w packages/client-core` — dual CJS/ESM builds pass
- `npm test -w packages/client-core` — 26 tests pass (4 suites)
- No raw fetch calls in client.ts or threads.ts (only streaming.ts retains fetch for SSE)
