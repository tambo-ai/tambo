import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { combineMutationResults, combineQueryResults } from "./query-utils";

type MutationStatus = "idle" | "pending" | "success" | "error";
type QueryStatus = "pending" | "success" | "error";

type MutationOverrides = Omit<
  Partial<UseMutationResult>,
  "status" | "isError" | "isIdle" | "isPending" | "isSuccess"
>;

function createMutationResult(
  status: MutationStatus,
  overrides: MutationOverrides = {},
): UseMutationResult {
  const base = {
    data: undefined,
    error: null,
    isPaused: false,
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    ...overrides,
    isError: status === "error",
    isIdle: status === "idle",
    isPending: status === "pending",
    isSuccess: status === "success",
    status,
  } as UseMutationResult;

  return base;
}

const idleMutation = (overrides: MutationOverrides = {}) =>
  createMutationResult("idle", overrides);

const pendingMutation = (overrides: MutationOverrides = {}) =>
  createMutationResult("pending", overrides);

const successMutation = (overrides: MutationOverrides = {}) =>
  createMutationResult("success", overrides);

const errorMutation = (error: Error, overrides: MutationOverrides = {}) =>
  createMutationResult("error", { ...overrides, error });

type QueryOverrides = Omit<
  Partial<UseQueryResult>,
  "status" | "isError" | "isPending" | "isSuccess"
>;

function createQueryResult(
  status: QueryStatus,
  overrides: QueryOverrides = {},
): UseQueryResult {
  const base = {
    data: undefined,
    error: null,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
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
    isError: status === "error",
    isPending: status === "pending",
    isSuccess: status === "success",
    status,
  } as UseQueryResult;

  return base;
}

const pendingQuery = (overrides: QueryOverrides = {}) =>
  createQueryResult("pending", overrides);

const successQuery = (overrides: QueryOverrides = {}) =>
  createQueryResult("success", overrides);

const errorQuery = (error: Error, overrides: QueryOverrides = {}) =>
  createQueryResult("error", { ...overrides, error });

describe("combineMutationResults", () => {
  describe("status determination", () => {
    it("returns pending when first mutation is pending", () => {
      const resultA = pendingMutation();
      const resultB = idleMutation();

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("pending");
      expect(combined.isPending).toBe(true);
    });

    it("returns pending when second mutation is pending", () => {
      const resultA = successMutation();
      const resultB = pendingMutation();

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("pending");
      expect(combined.isPending).toBe(true);
    });

    it("returns error when first mutation has error (and neither pending)", () => {
      const errorA = new Error("First error");
      const resultA = errorMutation(errorA);
      const resultB = successMutation();

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("error");
      expect(combined.isError).toBe(true);
      expect(combined.error).toBe(errorA);
    });

    it("returns error when second mutation has error (and neither pending)", () => {
      const errorB = new Error("Second error");
      const resultA = successMutation();
      const resultB = errorMutation(errorB);

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("error");
      expect(combined.isError).toBe(true);
      expect(combined.error).toBe(errorB);
    });

    it("returns success when both mutations are successful", () => {
      const resultA = successMutation();
      const resultB = successMutation();

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("success");
      expect(combined.isSuccess).toBe(true);
    });

    it("returns idle when both mutations are idle", () => {
      const resultA = idleMutation();
      const resultB = idleMutation();

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("idle");
      expect(combined.isIdle).toBe(true);
    });

    it("returns idle when one is idle and one is success (not both success)", () => {
      const resultA = idleMutation();
      const resultB = successMutation();

      const combined = combineMutationResults(resultA, resultB);

      expect(combined.status).toBe("idle");
      // isIdle is only true if BOTH are idle
      expect(combined.isIdle).toBe(false);
    });
  });

  describe("boolean flags", () => {
    it("isPending is true if either is pending", () => {
      const resultA = pendingMutation();
      const resultB = idleMutation();

      expect(combineMutationResults(resultA, resultB).isPending).toBe(true);
      expect(combineMutationResults(resultB, resultA).isPending).toBe(true);
    });

    it("isSuccess is true only if both are successful", () => {
      const success = successMutation();
      const notSuccess = idleMutation();

      expect(combineMutationResults(success, success).isSuccess).toBe(true);
      expect(combineMutationResults(success, notSuccess).isSuccess).toBe(false);
      expect(combineMutationResults(notSuccess, success).isSuccess).toBe(false);
    });

    it("isError is true if either has error", () => {
      const error = errorMutation(new Error("Error A"));
      const noError = idleMutation();

      expect(combineMutationResults(error, noError).isError).toBe(true);
      expect(combineMutationResults(noError, error).isError).toBe(true);
      expect(combineMutationResults(noError, noError).isError).toBe(false);
    });

    it("isIdle is true only if both are idle", () => {
      const idle = idleMutation();
      const notIdle = pendingMutation();

      expect(combineMutationResults(idle, idle).isIdle).toBe(true);
      expect(combineMutationResults(idle, notIdle).isIdle).toBe(false);
      expect(combineMutationResults(notIdle, idle).isIdle).toBe(false);
    });

    it("isPaused is true if either is paused", () => {
      const paused = idleMutation({ isPaused: true });
      const notPaused = idleMutation();

      expect(combineMutationResults(paused, notPaused).isPaused).toBe(true);
      expect(combineMutationResults(notPaused, paused).isPaused).toBe(true);
    });
  });

  describe("numeric aggregation", () => {
    it("sums failureCount from both mutations", () => {
      const resultA = idleMutation({ failureCount: 2 });
      const resultB = idleMutation({ failureCount: 3 });

      expect(combineMutationResults(resultA, resultB).failureCount).toBe(5);
    });

    it("uses first non-null submittedAt", () => {
      const resultA = idleMutation({ submittedAt: 1000 });
      const resultB = idleMutation({ submittedAt: 2000 });

      expect(combineMutationResults(resultA, resultB).submittedAt).toBe(1000);
    });

    it("uses second submittedAt if first is falsy", () => {
      const resultA = idleMutation({ submittedAt: 0 });
      const resultB = idleMutation({ submittedAt: 2000 });

      expect(combineMutationResults(resultA, resultB).submittedAt).toBe(2000);
    });
  });

  describe("error and failureReason", () => {
    it("uses first error if present", () => {
      const errorA = new Error("Error A");
      const errorB = new Error("Error B");
      const resultA = errorMutation(errorA);
      const resultB = errorMutation(errorB);

      expect(combineMutationResults(resultA, resultB).error).toBe(errorA);
    });

    it("uses second error if first is null", () => {
      const errorB = new Error("Error B");
      const resultA = idleMutation();
      const resultB = errorMutation(errorB);

      expect(combineMutationResults(resultA, resultB).error).toBe(errorB);
    });

    it("uses first failureReason if present", () => {
      const reasonA = new Error("Reason A");
      const reasonB = new Error("Reason B");
      const resultA = idleMutation({ failureReason: reasonA });
      const resultB = idleMutation({ failureReason: reasonB });

      expect(combineMutationResults(resultA, resultB).failureReason).toBe(
        reasonA,
      );
    });
  });
});

describe("combineQueryResults", () => {
  describe("status determination", () => {
    it("returns pending when first query is pending", () => {
      const resultA = pendingQuery();
      const resultB = successQuery();

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("pending");
      expect(combined.isPending).toBe(true);
    });

    it("returns pending when second query is pending", () => {
      const resultA = successQuery();
      const resultB = pendingQuery();

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("pending");
    });

    it("returns error when first query has error (and neither pending)", () => {
      const errorA = new Error("Query error");
      const resultA = errorQuery(errorA);
      const resultB = successQuery();

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("error");
      expect(combined.isError).toBe(true);
    });

    it("returns success when both queries are successful", () => {
      const resultA = successQuery();
      const resultB = successQuery();

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("success");
      expect(combined.isSuccess).toBe(true);
    });

    it("returns pending as fallback when neither pending, error, nor both success", () => {
      // This is an edge case - one success, one not (but not error or pending)
      const resultA = successQuery();
      const resultB = {
        ...pendingQuery(),
        isPending: false,
        isSuccess: false,
        isError: false,
      } as unknown as UseQueryResult;

      const combined = combineQueryResults(resultA, resultB);

      expect(combined.status).toBe("pending");
    });
  });

  describe("fetchStatus determination", () => {
    it("returns fetching when either is fetching", () => {
      const resultA = pendingQuery({
        isFetching: true,
        fetchStatus: "fetching",
      });
      const resultB = pendingQuery({
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
      const resultA = pendingQuery({
        isPaused: true,
        isFetching: false,
        fetchStatus: "paused",
      });
      const resultB = pendingQuery({
        isPaused: false,
        isFetching: false,
        fetchStatus: "idle",
      });

      expect(combineQueryResults(resultA, resultB).fetchStatus).toBe("paused");
    });

    it("returns idle when neither fetching nor paused", () => {
      const resultA = pendingQuery({
        isFetching: false,
        isPaused: false,
        fetchStatus: "idle",
      });
      const resultB = pendingQuery({
        isFetching: false,
        isPaused: false,
        fetchStatus: "idle",
      });

      expect(combineQueryResults(resultA, resultB).fetchStatus).toBe("idle");
    });
  });

  describe("boolean flags", () => {
    it("isLoading is true if either is loading", () => {
      const loading = pendingQuery({ isLoading: true });
      const notLoading = pendingQuery({ isLoading: false });

      expect(combineQueryResults(loading, notLoading).isLoading).toBe(true);
      expect(combineQueryResults(notLoading, notLoading).isLoading).toBe(false);
    });

    it("isFetched is true only if both are fetched", () => {
      const fetched = pendingQuery({ isFetched: true });
      const notFetched = pendingQuery({ isFetched: false });

      expect(combineQueryResults(fetched, fetched).isFetched).toBe(true);
      expect(combineQueryResults(fetched, notFetched).isFetched).toBe(false);
    });

    it("isFetchedAfterMount is true only if both are fetched after mount", () => {
      const fetched = pendingQuery({ isFetchedAfterMount: true });
      const notFetched = pendingQuery({ isFetchedAfterMount: false });

      expect(combineQueryResults(fetched, fetched).isFetchedAfterMount).toBe(
        true,
      );
      expect(combineQueryResults(fetched, notFetched).isFetchedAfterMount).toBe(
        false,
      );
    });

    it("isInitialLoading is true if either is initial loading", () => {
      const loading = pendingQuery({ isInitialLoading: true });
      const notLoading = pendingQuery({ isInitialLoading: false });

      expect(combineQueryResults(loading, notLoading).isInitialLoading).toBe(
        true,
      );
    });

    it("isLoadingError is true if either has loading error", () => {
      const error = pendingQuery({ isLoadingError: true });
      const noError = pendingQuery({ isLoadingError: false });

      expect(combineQueryResults(error, noError).isLoadingError).toBe(true);
    });

    it("isRefetchError is true if either has refetch error", () => {
      const error = pendingQuery({ isRefetchError: true });
      const noError = pendingQuery({ isRefetchError: false });

      expect(combineQueryResults(error, noError).isRefetchError).toBe(true);
    });

    it("isPlaceholderData is true if either has placeholder data", () => {
      const placeholder = pendingQuery({ isPlaceholderData: true });
      const noPlaceholder = pendingQuery({ isPlaceholderData: false });

      expect(
        combineQueryResults(placeholder, noPlaceholder).isPlaceholderData,
      ).toBe(true);
    });

    it("isStale is true if either is stale", () => {
      const stale = pendingQuery({ isStale: true });
      const notStale = pendingQuery({ isStale: false });

      expect(combineQueryResults(stale, notStale).isStale).toBe(true);
    });

    it("isRefetching is true if either is refetching", () => {
      const refetching = pendingQuery({ isRefetching: true });
      const notRefetching = pendingQuery({ isRefetching: false });

      expect(combineQueryResults(refetching, notRefetching).isRefetching).toBe(
        true,
      );
    });

    it("isEnabled is true only if both are enabled", () => {
      const enabled = pendingQuery({ isEnabled: true });
      const disabled = pendingQuery({ isEnabled: false });

      expect(combineQueryResults(enabled, enabled).isEnabled).toBe(true);
      expect(combineQueryResults(enabled, disabled).isEnabled).toBe(false);
    });
  });

  describe("numeric aggregation", () => {
    it("sums failureCount from both queries", () => {
      const resultA = pendingQuery({ failureCount: 1 });
      const resultB = pendingQuery({ failureCount: 4 });

      expect(combineQueryResults(resultA, resultB).failureCount).toBe(5);
    });

    it("sums errorUpdateCount from both queries", () => {
      const resultA = pendingQuery({ errorUpdateCount: 2 });
      const resultB = pendingQuery({ errorUpdateCount: 3 });

      expect(combineQueryResults(resultA, resultB).errorUpdateCount).toBe(5);
    });

    it("uses max dataUpdatedAt", () => {
      const resultA = pendingQuery({ dataUpdatedAt: 1000 });
      const resultB = pendingQuery({ dataUpdatedAt: 2000 });

      expect(combineQueryResults(resultA, resultB).dataUpdatedAt).toBe(2000);
      expect(combineQueryResults(resultB, resultA).dataUpdatedAt).toBe(2000);
    });

    it("uses max errorUpdatedAt", () => {
      const resultA = pendingQuery({ errorUpdatedAt: 500 });
      const resultB = pendingQuery({ errorUpdatedAt: 1500 });

      expect(combineQueryResults(resultA, resultB).errorUpdatedAt).toBe(1500);
    });
  });

  describe("error and failureReason", () => {
    it("uses first error if present", () => {
      const errorA = new Error("Error A");
      const errorB = new Error("Error B");
      const resultA = errorQuery(errorA);
      const resultB = errorQuery(errorB);

      expect(combineQueryResults(resultA, resultB).error).toBe(errorA);
    });

    it("uses second error if first is null", () => {
      const errorB = new Error("Error B");
      const resultA = pendingQuery();
      const resultB = errorQuery(errorB);

      expect(combineQueryResults(resultA, resultB).error).toBe(errorB);
    });

    it("uses first failureReason if present", () => {
      const reasonA = new Error("Reason A");
      const reasonB = new Error("Reason B");
      const resultA = pendingQuery({ failureReason: reasonA });
      const resultB = pendingQuery({ failureReason: reasonB });

      expect(combineQueryResults(resultA, resultB).failureReason).toBe(reasonA);
    });
  });
});
