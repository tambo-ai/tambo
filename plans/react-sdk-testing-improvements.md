# React SDK Testing Improvements

## Overview

Improve testing coverage in the react-sdk by adding focused behavioral tests for the most critical untested user flows.

## Problem Statement

Several critical user-facing features have dangerously low test coverage:

| File                        | Lines  | Branches | User Impact                        |
| --------------------------- | ------ | -------- | ---------------------------------- |
| `use-tambo-voice.tsx`       | 17.85% | 0%       | Voice input completely untested    |
| `tambo-client-provider.tsx` | 53.12% | 20%      | API client initialization untested |
| `use-message-images.ts`     | 53.57% | 50%      | Image error handling gaps          |

## Philosophy

**Test behavior, not implementation.**

Each test should answer: "If I refactor the implementation but keep behavior the same, will this test still pass?" If no, we're testing implementation details.

We're NOT chasing coverage numbers. We're protecting user-facing features from regressions.

---

## Test Suite 1: `use-tambo-voice.test.tsx` (NEW)

**Current Coverage**: 17.85% lines, 0% branches
**Target**: Cover the complete recording → transcription flow
**Estimated Tests**: 8

### User Journey Tests

```typescript
// src/hooks/use-tambo-voice.test.tsx

describe("useTamboVoice", () => {
  describe("Recording Flow", () => {
    it("should transition from idle → recording → stopped → transcribed", async () => {
      // User clicks record
      // User speaks
      // User clicks stop
      // Transcript appears
    });

    it("should reset state when starting a new recording", async () => {
      // First recording completes with transcript
      // User starts new recording
      // Previous transcript is cleared
    });
  });

  describe("Error Handling", () => {
    it("should expose error when microphone access is denied", () => {
      // Browser denies mic access
      // mediaAccessError is populated
    });

    it("should expose error when transcription API fails", async () => {
      // Recording succeeds
      // API call fails
      // transcriptionError is populated
    });

    it("should handle blob fetch failure gracefully", async () => {
      // Recording stops
      // Blob URL fetch fails
      // Error is exposed, no crash
    });
  });

  describe("State Exposure", () => {
    it("should expose isRecording during active recording", () => {
      // Start recording
      // isRecording = true
      // Stop recording
      // isRecording = false
    });

    it("should expose isTranscribing during API call", async () => {
      // Recording stops
      // isTranscribing = true during API call
      // isTranscribing = false after completion
    });
  });
});
```

### Implementation Notes

- Mock `react-media-recorder` at module level (already done in setupTests.ts)
- Mock the transcription API response, not internal hook wiring
- Use `waitFor()` for all async state transitions
- NO tests for "ignores call if already recording" - that's implementation detail

---

## Test Suite 2: `tambo-client-provider.test.tsx` (NEW)

**Current Coverage**: 53.12% lines, 20% branches
**Target**: Cover client initialization and hook contracts
**Estimated Tests**: 7

### Provider Contract Tests

```typescript
// src/providers/tambo-client-provider.test.tsx

describe("TamboClientProvider", () => {
  describe("Client Configuration", () => {
    it("should create client with apiKey", () => {
      // Render provider with apiKey
      // Client is accessible via hook
    });

    it("should apply custom baseURL when tamboUrl provided", () => {
      // Render with tamboUrl prop
      // Client uses custom baseURL
    });

    it("should apply environment when provided", () => {
      // Render with environment="staging"
      // Client configured for staging
    });
  });

  describe("Token State", () => {
    it("should expose isUpdatingToken from session token hook", () => {
      // Mock session token hook with isFetching=true
      // useIsTamboTokenUpdating returns true
    });
  });
});

describe("Hook Contracts", () => {
  describe("useTamboClient", () => {
    it("should return client instance inside provider", () => {
      // Wrap in provider
      // Hook returns TamboAI client
    });

    it("should throw descriptive error outside provider", () => {
      // No provider wrapper
      // Hook throws with helpful message
    });
  });

  describe("useTamboQueryClient", () => {
    it("should return QueryClient instance inside provider", () => {
      // Wrap in provider
      // Hook returns QueryClient
    });

    it("should throw descriptive error outside provider", () => {
      // No provider wrapper
      // Hook throws with helpful message
    });
  });
});
```

### Implementation Notes

- Mock `useTamboSessionToken` to control token state
- Verify TamboAI constructor receives correct config
- Test the PUBLIC API (hooks), not internal wiring
- "Throws outside provider" tests are contract tests, not implementation tests

---

## Test Suite 3: `use-message-images.test.ts` (ENHANCE)

**Current Coverage**: 53.57% lines, 50% branches
**Target**: Cover batch operations and error paths
**Estimated Tests**: 6 additional

### Additional Tests

```typescript
// src/hooks/use-message-images.test.ts (additions)

describe("useMessageImages", () => {
  // EXISTING TESTS: basic add, reject non-image, remove, clear

  describe("Batch Operations", () => {
    it("should add multiple images at once", async () => {
      // Call addImages with 3 valid files
      // All 3 appear in images array
    });

    it("should filter non-images from batch and add valid ones", async () => {
      // Call addImages with [image, pdf, image]
      // Only 2 images added, no error thrown
    });

    it("should reject batch with zero valid images", async () => {
      // Call addImages with [pdf, doc]
      // Error thrown with helpful message
    });
  });

  describe("Error Handling", () => {
    it("should reject when FileReader fails", async () => {
      // Mock FileReader.onerror
      // addImage rejects with error
    });
  });

  describe("Edge Cases", () => {
    it("should handle removing non-existent image gracefully", () => {
      // Call removeImage with fake ID
      // No error, no state change
    });
  });
});
```

### Implementation Notes

- Mock `FileReader` to test error path
- DON'T test "generates unique IDs" - that's testing crypto.randomUUID
- DON'T test "special characters in filename" - no bug report, YAGNI

---

## What We're NOT Testing (And Why)

### `use-streaming-props.tsx` - SKIP

**Reason**: Deprecated hook (see file header). Testing deprecated code is like painting a house you're about to demolish. If it breaks, remove it.

### `tambo-mcp-token-provider.tsx` - SKIP

**Reason**: 64% coverage is acceptable for infrastructure code. The existing tests cover the happy path. Edge cases can be added when bugs surface.

### `tambo-thread-input-provider.tsx` - SKIP

**Reason**: 73% coverage is already good. Has integration tests covering message submission. Diminishing returns.

### Granular Implementation Tests - SKIP

Examples of tests we're NOT writing:

- "should ignore startRecording if already recording" - implementation detail
- "should generate unique IDs for each image" - tests crypto.randomUUID, not our code
- "should preserve image order in batch add" - no user requirement for ordering
- "should handle very large files" - no bug report, YAGNI

---

## Acceptance Criteria

### Functional Requirements

- [ ] All new tests pass without flakiness
- [ ] No regressions in existing 679 tests
- [ ] Tests follow behavioral testing patterns

### Coverage Goals

- [ ] `use-tambo-voice.tsx`: 0% → 75%+ branch coverage
- [ ] `tambo-client-provider.tsx`: 20% → 70%+ branch coverage
- [ ] `use-message-images.ts`: 50% → 75%+ branch coverage
- [ ] Global line coverage stays >= 82%

### Quality Gates

- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] `npm run check-types` passes

---

## Implementation Order

1. **`use-tambo-voice.test.tsx`** (~8 tests) - Highest risk, complete user flow with zero tests
2. **`tambo-client-provider.test.tsx`** (~7 tests) - Foundation of all API calls
3. **`use-message-images.test.ts`** (~6 tests) - Enhance existing, quick win

**Total: ~21 new tests** (down from 70+ in original plan)

---

## Type Safety Requirements

All test helpers MUST use proper types:

```typescript
// GOOD
const createMockClient = (): Pick<TamboAI, 'beta'> => ({
  beta: { /* ... */ }
});

// BAD - loses type checking
const createMockClient = (): any => ({...});
```

---

## References

### Existing Test Examples (Copy These Patterns)

- `src/hooks/use-tambo-stream-status.test.tsx` - Behavioral hook testing
- `src/hooks/use-message-images.test.ts` - FileReader mocking
- `src/providers/tambo-registry-provider.test.tsx` - Provider contract testing

### Key Principles Applied

- Test behavior, not implementation (DHH)
- Mock at boundaries, not internals (Kieran)
- YAGNI - no tests for problems that don't exist yet (Simplicity)
