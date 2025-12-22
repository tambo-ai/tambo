import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { combineMutationResults, combineQueryResults } from "./query-utils";

// Helper to create mock mutation results - uses type assertions because
// React Query's discriminated union types are complex and test mocks don't
// need to satisfy all constraints
function createMockMutationResult(
  overrides: Record<string, unknown> = {},
): UseMutationResult {
  return {
    data: undefined,
    error: null,
    isError: false,
    isIdle: true,
    isPending: false,
    isSuccess: false,
    isPaused: false,
    status: "idle",
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  } as UseMutationResult;
}

// Helper to create mock query results - uses type assertions because
// React Query's discriminated union types are complex and test mocks don't
// need to satisfy all constraints
function createMockQueryResult(
  overrides: Record<string, unknown> = {},
): UseQueryResult {
  return {
    data: undefined,
    error: null,
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: true,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: false,
    status: "pending",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    errorUpdateCount: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: "idle",
    refetch: jest.fn(),
    promise: Promise.resolve(undefined),
    isEnabled: true,
    ...overrides,
  } as UseQueryResult;
}

describe("combineMutationResults", () => {
  describe("status determination", () => {
    it("returns pending when first mutation is pending", () => {
      const resultA = createMockMutationResult({
        isPending: true,
        status: "pending",
      });
      const resultB = createMockMutationResult({
        isIdle: true,
        status: "idle",
      });

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("pending");
      expect(combined.isPending).toBe(true);
    });

    it("returns pending when second mutation is pending", () => {
      const resultA = createMockMutationResult({
        isSuccess: true,
        status: "success",
      });
      const resultB = createMockMutationResult({
        isPending: true,
        status: "pending",
      });

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("pending");
      expect(combined.isPending).toBe(true);
    });

    it("returns error when first mutation has error (and neither pending)", () => {
      const resultA = createMockMutationResult({
        isError: true,
        status: "error",
        error: new Error("First error"),
      });
      const resultB = createMockMutationResult({
        isSuccess: true,
        status: "success",
      });

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("error");
      expect(combined.isError).toBe(true);
      expect(combined.error).toEqual(new Error("First error"));
    });

    it("returns error when second mutation has error (and neither pending)", () => {
      const resultA = createMockMutationResult({
        isSuccess: true,
        status: "success",
      });
      const resultB = createMockMutationResult({
        isError: true,
        status: "error",
        error: new Error("Second error"),
      });

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("error");
      expect(combined.isError).toBe(true);
      expect(combined.error).toEqual(new Error("Second error"));
    });

    it("returns success when both mutations are successful", () => {
      const resultA = createMockMutationResult({
        isSuccess: true,
        status: "success",
      });
      const resultB = createMockMutationResult({
        isSuccess: true,
        status: "success",
      });

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("success");
      expect(combined.isSuccess).toBe(true);
    });

    it("returns idle when both mutations are idle", () => {
      const resultA = createMockMutationResult({
        isIdle: true,
        status: "idle",
      });
      const resultB = createMockMutationResult({
        isIdle: true,
        status: "idle",
      });

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("idle");
      expect(combined.isIdle).toBe(true);
    });

    it("returns idle when one is idle and one is success (not both success)", () => {
      const resultA = createMockMutationResult({
        isIdle: true,
        status: "idle",
      });
      const resultB = createMockMutationResult({
        isSuccess: true,
        isIdle: false,
        status: "success",
      });

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("idle");
      // isIdle is only true if BOTH are idle
      expect(combined.isIdle).toBe(false);
    });
  });

  describe("boolean flags", () => {
    it("isPending is true if either is pending", () => {
      const resultA = createMockMutationResult({ isPending: true });
      const resultB = createMockMutationResult({ isPending: false });

      expect(combineMutationResults(resultA, resultB).isPending).toBe(true);
      expect(combineMutationResults(resultB, resultA).isPending).toBe(true);
    });

    it("isSuccess is true only if both are successful", () => {
      const success = createMockMutationResult({ isSuccess: true });
      const notSuccess = createMockMutationResult({ isSuccess: false });

      expect(combineMutationResults(success, success).isSuccess).toBe(true);
      expect(combineMutationResults(success, notSuccess).isSuccess).toBe(false);
      expect(combineMutationResults(notSuccess, success).isSuccess).toBe(false);
    });

    it("isError is true if either has error", () => {
      const error = createMockMutationResult({ isError: true });
      const noError = createMockMutationResult({ isError: false });

      expect(combineMutationResults(error, noError).isError).toBe(true);
      expect(combineMutationResults(noError, error).isError).toBe(true);
      expect(combineMutationResults(noError, noError).isError).toBe(false);
    });

    it("isIdle is true only if both are idle", () => {
      const idle = createMockMutationResult({ isIdle: true });
      const notIdle = createMockMutationResult({ isIdle: false });

      expect(combineMutationResults(idle, idle).isIdle).toBe(true);
      expect(combineMutationResults(idle, notIdle).isIdle).toBe(false);
      expect(combineMutationResults(notIdle, idle).isIdle).toBe(false);
    });

    it("isPaused is true if either is paused", () => {
      const paused = createMockMutationResult({ isPaused: true });
      const notPaused = createMockMutationResult({ isPaused: false });

      expect(combineMutationResults(paused, notPaused).isPaused).toBe(true);
      expect(combineMutationResults(notPaused, paused).isPaused).toBe(true);
    });
  });

  describe("numeric aggregation", () => {
    it("sums failureCount from both mutations", () => {
      const resultA = createMockMutationResult({ failureCount: 2 });
      const resultB = createMockMutationResult({ failureCount: 3 });

      expect(combineMutationResults(resultA, resultB).failureCount).toBe(5);
    });

    it("uses first non-null submittedAt", () => {
      const resultA = createMockMutationResult({ submittedAt: 1000 });
      const resultB = createMockMutationResult({ submittedAt: 2000 });

      expect(combineMutationResults(resultA, resultB).submittedAt).toBe(1000);
    });

    it("uses second submittedAt if first is falsy", () => {
      const resultA = createMockMutationResult({ submittedAt: 0 });
      const resultB = createMockMutationResult({ submittedAt: 2000 });

      expect(combineMutationResults(resultA, resultB).submittedAt).toBe(2000);
    });
  });

  describe("error and failureReason", () => {
    it("uses first error if present", () => {
      const errorA = new Error("Error A");
      const errorB = new Error("Error B");
      const resultA = createMockMutationResult({ error: errorA });
      const resultB = createMockMutationResult({ error: errorB });

      expect(combineMutationResults(resultA, resultB).error).toBe(errorA);
    });

    it("uses second error if first is null", () => {
      const errorB = new Error("Error B");
      const resultA = createMockMutationResult({ error: null });
      const resultB = createMockMutationResult({ error: errorB });

      expect(combineMutationResults(resultA, resultB).error).toBe(errorB);
    });

    it("uses first failureReason if present", () => {
      const resultA = createMockMutationResult({ failureReason: "Reason A" });
      const resultB = createMockMutationResult({ failureReason: "Reason B" });

      expect(combineMutationResults(resultA, resultB).failureReason).toBe(
        "Reason A",
      );
    });
  });
});

describe("combineQueryResults", () => {
  describe("status determination", () => {
    it("returns pending when first query is pending", () => {
      const resultA = createMockQueryResult({
        isPending: true,
        status: "pending",
      });
      const resultB = createMockQueryResult({
        isSuccess: true,
        status: "success",
        isPending: false,
      });

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("pending");
      expect(combined.isPending).toBe(true);
    });

    it("returns pending when second query is pending", () => {
      const resultA = createMockQueryResult({
        isSuccess: true,
        status: "success",
        isPending: false,
      });
      const resultB = createMockQueryResult({
        isPending: true,
        status: "pending",
      });

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("pending");
    });

    it("returns error when first query has error (and neither pending)", () => {
      const resultA = createMockQueryResult({
        isError: true,
        status: "error",
        isPending: false,
        error: new Error("Query error"),
      });
      const resultB = createMockQueryResult({
        isSuccess: true,
        status: "success",
        isPending: false,
      });

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("error");
      expect(combined.isError).toBe(true);
    });

    it("returns success when both queries are successful", () => {
      const resultA = createMockQueryResult({
        isSuccess: true,
        status: "success",
        isPending: false,
      });
      const resultB = createMockQueryResult({
        isSuccess: true,
        status: "success",
        isPending: false,
      });

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("success");
      expect(combined.isSuccess).toBe(true);
    });

    it("returns pending as fallback when neither pending, error, nor both success", () => {
      // This is an edge case - one success, one not (but not error or pending)
      const resultA = createMockQueryResult({
        isSuccess: true,
        status: "success",
        isPending: false,
      });
      const resultB = createMockQueryResult({
        isSuccess: false,
        isPending: false,
        isError: false,
        status: "pending", // e.g. initial state
      });

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("pending");
    });
  });

  describe("fetchStatus determination", () => {
    it("returns fetching when either is fetching", () => {
      const resultA = createMockQueryResult({
        isFetching: true,
        fetchStatus: "fetching",
      });
      const resultB = createMockQueryResult({
        isFetching: false,
        fetchStatus: "idle",
      });

      expect(combineQueryResults(resultA, resultB).fetchStatus).toBe(
        "fetching",
      );
      expect(combineQueryResults(resultB, resultA).fetchStatus).toBe(
        "fetching",
      );
    });

    it("returns paused when either is paused (and neither fetching)", () => {
      const resultA = createMockQueryResult({
        isPaused: true,
        isFetching: false,
        fetchStatus: "paused",
      });
      const resultB = createMockQueryResult({
        isPaused: false,
        isFetching: false,
        fetchStatus: "idle",
      });

      expect(combineQueryResults(resultA, resultB).fetchStatus).toBe("paused");
    });

    it("returns idle when neither fetching nor paused", () => {
      const resultA = createMockQueryResult({
        isFetching: false,
        isPaused: false,
        fetchStatus: "idle",
      });
      const resultB = createMockQueryResult({
        isFetching: false,
        isPaused: false,
        fetchStatus: "idle",
      });

      expect(combineQueryResults(resultA, resultB).fetchStatus).toBe("idle");
    });
  });

  describe("boolean flags", () => {
    it("isLoading is true if either is loading", () => {
      const loading = createMockQueryResult({ isLoading: true });
      const notLoading = createMockQueryResult({ isLoading: false });

      expect(combineQueryResults(loading, notLoading).isLoading).toBe(true);
      expect(combineQueryResults(notLoading, notLoading).isLoading).toBe(false);
    });

    it("isFetched is true only if both are fetched", () => {
      const fetched = createMockQueryResult({ isFetched: true });
      const notFetched = createMockQueryResult({ isFetched: false });

      expect(combineQueryResults(fetched, fetched).isFetched).toBe(true);
      expect(combineQueryResults(fetched, notFetched).isFetched).toBe(false);
    });

    it("isFetchedAfterMount is true only if both are fetched after mount", () => {
      const fetched = createMockQueryResult({ isFetchedAfterMount: true });
      const notFetched = createMockQueryResult({ isFetchedAfterMount: false });

      expect(combineQueryResults(fetched, fetched).isFetchedAfterMount).toBe(
        true,
      );
      expect(combineQueryResults(fetched, notFetched).isFetchedAfterMount).toBe(
        false,
      );
    });

    it("isInitialLoading is true if either is initial loading", () => {
      const loading = createMockQueryResult({ isInitialLoading: true });
      const notLoading = createMockQueryResult({ isInitialLoading: false });

      expect(combineQueryResults(loading, notLoading).isInitialLoading).toBe(
        true,
      );
    });

    it("isLoadingError is true if either has loading error", () => {
      const error = createMockQueryResult({ isLoadingError: true });
      const noError = createMockQueryResult({ isLoadingError: false });

      expect(combineQueryResults(error, noError).isLoadingError).toBe(true);
    });

    it("isRefetchError is true if either has refetch error", () => {
      const error = createMockQueryResult({ isRefetchError: true });
      const noError = createMockQueryResult({ isRefetchError: false });

      expect(combineQueryResults(error, noError).isRefetchError).toBe(true);
    });

    it("isPlaceholderData is true if either has placeholder data", () => {
      const placeholder = createMockQueryResult({ isPlaceholderData: true });
      const noPlaceholder = createMockQueryResult({ isPlaceholderData: false });

      expect(
        combineQueryResults(placeholder, noPlaceholder).isPlaceholderData,
      ).toBe(true);
    });

    it("isStale is true if either is stale", () => {
      const stale = createMockQueryResult({ isStale: true });
      const notStale = createMockQueryResult({ isStale: false });

      expect(combineQueryResults(stale, notStale).isStale).toBe(true);
    });

    it("isRefetching is true if either is refetching", () => {
      const refetching = createMockQueryResult({ isRefetching: true });
      const notRefetching = createMockQueryResult({ isRefetching: false });

      expect(combineQueryResults(refetching, notRefetching).isRefetching).toBe(
        true,
      );
    });

    it("isEnabled is true only if both are enabled", () => {
      const enabled = createMockQueryResult({ isEnabled: true });
      const disabled = createMockQueryResult({ isEnabled: false });

      expect(combineQueryResults(enabled, enabled).isEnabled).toBe(true);
      expect(combineQueryResults(enabled, disabled).isEnabled).toBe(false);
    });
  });

  describe("numeric aggregation", () => {
    it("sums failureCount from both queries", () => {
      const resultA = createMockQueryResult({ failureCount: 1 });
      const resultB = createMockQueryResult({ failureCount: 4 });

      expect(combineQueryResults(resultA, resultB).failureCount).toBe(5);
    });

    it("sums errorUpdateCount from both queries", () => {
      const resultA = createMockQueryResult({ errorUpdateCount: 2 });
      const resultB = createMockQueryResult({ errorUpdateCount: 3 });

      expect(combineQueryResults(resultA, resultB).errorUpdateCount).toBe(5);
    });

    it("uses max dataUpdatedAt", () => {
      const resultA = createMockQueryResult({ dataUpdatedAt: 1000 });
      const resultB = createMockQueryResult({ dataUpdatedAt: 2000 });

      expect(combineQueryResults(resultA, resultB).dataUpdatedAt).toBe(2000);
      expect(combineQueryResults(resultB, resultA).dataUpdatedAt).toBe(2000);
    });

    it("uses max errorUpdatedAt", () => {
      const resultA = createMockQueryResult({ errorUpdatedAt: 500 });
      const resultB = createMockQueryResult({ errorUpdatedAt: 1500 });

      expect(combineQueryResults(resultA, resultB).errorUpdatedAt).toBe(1500);
    });
  });

  describe("error and failureReason", () => {
    it("uses first error if present", () => {
      const errorA = new Error("Error A");
      const errorB = new Error("Error B");
      const resultA = createMockQueryResult({ error: errorA });
      const resultB = createMockQueryResult({ error: errorB });

      expect(combineQueryResults(resultA, resultB).error).toBe(errorA);
    });

    it("uses second error if first is null", () => {
      const errorB = new Error("Error B");
      const resultA = createMockQueryResult({ error: null });
      const resultB = createMockQueryResult({ error: errorB });

      expect(combineQueryResults(resultA, resultB).error).toBe(errorB);
    });

    it("uses first failureReason if present", () => {
      const resultA = createMockQueryResult({ failureReason: "Reason A" });
      const resultB = createMockQueryResult({ failureReason: "Reason B" });

      expect(combineQueryResults(resultA, resultB).failureReason).toBe(
        "Reason A",
      );
    });
  });
});
