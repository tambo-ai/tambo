# Phase 0: SDK Compatibility Verification

This document tracks the verification of `@tambo-ai/typescript-sdk` compatibility with the v1 API implementation.

## Status: ⚠️ VERIFICATION REQUIRED

The following assumptions must be verified before Phase 1 can be considered complete:

## 1. TypeScript SDK v1 Exports

**Assumption**: `@tambo-ai/typescript-sdk` package provides v1-specific exports via `/v1` subpath.

**Required Exports**:

- [ ] `Thread` type (from `@tambo-ai/typescript-sdk/v1`)
- [ ] `Message` type (from `@tambo-ai/typescript-sdk/v1`)
- [ ] `Content` type (from `@tambo-ai/typescript-sdk/v1`)
- [ ] `RunStatus` type (from `@tambo-ai/typescript-sdk/v1`)
- [ ] `AvailableComponent` type (from `@tambo-ai/typescript-sdk/v1`)
- [ ] `Tool` type (from `@tambo-ai/typescript-sdk/v1`)
- [ ] `JsonPatchOperation` type (from `@tambo-ai/typescript-sdk/v1`)
- [ ] `ToolResultContent` type (from `@tambo-ai/typescript-sdk/v1`)

**Verification Method**:

```bash
# Check if types are exported
npx tsc --noEmit --skipLibCheck test-v1-imports.ts

# test-v1-imports.ts content:
import type { Thread, Message, Content } from '@tambo-ai/typescript-sdk/v1';
```

**Status**: ❌ Not yet verified
**Action Required**: Run verification script after TypeScript SDK v1 support is released

## 2. Stream Class Compatibility

**Assumption**: `Stream.fromSSEResponse()` from `@tambo-ai/typescript-sdk/core` works with v1 API responses.

**Required Functionality**:

- [ ] `Stream.fromSSEResponse(response, abortController)` exists
- [ ] Returns `AsyncIterable<BaseEvent>` compatible with AG-UI events
- [ ] Handles SSE parsing correctly for v1 API format

**Verification Method**:

```typescript
import { Stream } from '@tambo-ai/typescript-sdk/core';

// Verify in actual v1 API integration test
const response = await fetch('/v1/threads/123/runs', { ... });
const stream = Stream.fromSSEResponse(response, new AbortController());
for await (const event of stream) {
  // event should match BaseEvent from @ag-ui/core
}
```

**Status**: ❌ Not yet verified
**Action Required**: Integration test with v1 API endpoint

## 3. TamboAI Client Compatibility

**Assumption**: The existing `TamboAI` client class works with v1 API endpoints.

**Required Functionality**:

- [ ] `new TamboAI({ apiKey, baseURL, environment })` constructor works as-is
- [ ] Client can make requests to `/v1/threads/{id}/runs` endpoints
- [ ] Session token management (`useTamboSessionToken`) works with v1 API
- [ ] Headers and authentication flow unchanged

**Verification Method**:

```typescript
const client = new TamboAI({ apiKey: 'test-key' });
const response = await client.fetch('/v1/threads/123/runs', {
  method: 'POST',
  body: JSON.stringify({ ... }),
});
```

**Status**: ✅ LIKELY COMPATIBLE (client is API-agnostic HTTP wrapper)
**Rationale**: `TamboClientProvider` creates a generic HTTP client that should work with any endpoint. The v1 API is just a different path (`/v1/` instead of `/beta/`).

**Action Required**: Confirm with integration test

## 4. TamboRegistryProvider Compatibility

**Assumption**: The existing `TamboRegistryProvider` can be reused for v1 without modification.

**Required Functionality**:

- [ ] Component registration logic is API-agnostic
- [ ] Tool registration logic is API-agnostic
- [ ] Schema conversion (Zod → JSON Schema) works for v1 format
- [ ] `TamboComponent` and `TamboTool` types match or extend v1 requirements

**Verification Method**:

1. Compare `TamboComponent` interface with v1 `AvailableComponent` type
2. Compare `TamboTool` interface with v1 `Tool` type
3. Verify schema output format matches v1 API expectations

**Status**: 🔄 IN PROGRESS (Phase 0 task)
**Action Required**: Read both interfaces and create comparison matrix

## 5. Type Compatibility Matrix

| Beta SDK Type    | v1 API Type          | Compatible? | Notes                         |
| ---------------- | -------------------- | ----------- | ----------------------------- |
| `TamboComponent` | `AvailableComponent` | TBD         | Need to compare shapes        |
| `TamboTool`      | `Tool`               | TBD         | Need to compare shapes        |
| `Thread` (beta)  | `Thread` (v1)        | TBD         | May have different fields     |
| `Message` (beta) | `Message` (v1)       | TBD         | Content blocks format differs |

**Action Required**: Complete this matrix in Phase 0

## 6. Runtime Type Guards

Since we're making assumptions about the TypeScript SDK exports, we need runtime validation:

**Required Guards**:

- [x] Event type discrimination (handled by `event.type` field)
- [ ] Event shape validation (validate event fields at runtime)
- [ ] API response shape validation (validate thread/message shapes)

**Implementation Strategy**:

```typescript
// Use discriminated unions for compile-time safety
switch (event.type) {
  case EventType.TEXT_MESSAGE_CONTENT:
    // TypeScript knows event is TextMessageContentEvent
    break;
}

// Add runtime validation for critical operations
function validateThread(data: unknown): data is Thread {
  // Runtime checks for required fields
  return typeof data === "object" && data !== null && "id" in data;
}
```

**Status**: 🔄 IN PROGRESS (implemented in Phase 2 reducer)

## 7. Dependencies to Add

The following dependencies are required for v1 implementation:

- [ ] `fast-json-patch` - JSON Patch implementation (Phase 2)
- [ ] `@ag-ui/core` - AG-UI event types (Phase 1) - **may already be available**

**Action Required**: Add to react-sdk/package.json in appropriate phases

## Next Steps

1. ✅ Create v1 directory structure
2. ⏭️ Define v1 types based on AG-UI protocol (can proceed without SDK verification)
3. ⏭️ Create type guards for runtime validation
4. ⏭️ Implement conversion utilities for registry (Phase 0)
5. ⏸️ BLOCKED: Full SDK verification requires TypeScript SDK v1 release or access to package

## Unblocking Strategy

Since we can't verify the TypeScript SDK immediately, we can proceed with:

1. **Define our own v1 types** based on the AG-UI protocol specification
2. **Use type assertions** with runtime guards where SDK imports would be
3. **Document all assumptions** in code comments
4. **Create integration tests** that will fail if SDK doesn't match expectations
5. **Replace type assertions** with actual SDK imports once v1 is released

This allows development to continue while marking clear TODO items for when SDK is available.
