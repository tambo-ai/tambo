import { renderHook } from "@testing-library/react";
import React from "react";
import {
  TamboClientProvider,
  useTamboClient,
  useTamboQueryClient,
  useIsTamboTokenUpdating,
} from "./tambo-client-provider";

// Mock the session token hook to control token fetching state
jest.mock("./hooks/use-tambo-session-token", () => ({
  useTamboSessionToken: jest.fn(),
}));

import { useTamboSessionToken } from "./hooks/use-tambo-session-token";

// Add fetch polyfill for jsdom environment (TamboAI SDK requires it)
const mockFetch = jest.fn();
const originalFetch = global.fetch;

describe("TamboClientProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetch.mockReset();

    global.fetch = mockFetch as unknown as typeof fetch;

    // Default mock: not fetching
    jest.mocked(useTamboSessionToken).mockReturnValue({
      isFetching: false,
      data: undefined,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      status: "pending",
      fetchStatus: "idle",
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createWrapper = (props: {
    apiKey: string;
    tamboUrl?: string;
    environment?: "production" | "staging";
    userToken?: string;
  }) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboClientProvider {...props}>{children}</TamboClientProvider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
  };

  describe("Client Configuration", () => {
    it("should create client accessible via useTamboClient hook", () => {
      const { result } = renderHook(() => useTamboClient(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      // Client should be a TamboAI instance with expected shape
      expect(result.current).toBeDefined();
      expect(result.current.beta).toBeDefined();
    });

    it("should provide the same client instance on re-renders", () => {
      const { result, rerender } = renderHook(() => useTamboClient(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      const firstClient = result.current;
      rerender();
      const secondClient = result.current;

      expect(firstClient).toBe(secondClient);
    });
  });

  describe("Token State", () => {
    it("should expose isUpdatingToken=true when session token is fetching", () => {
      jest.mocked(useTamboSessionToken).mockReturnValue({
        isFetching: true,
      } as any);

      const { result } = renderHook(() => useIsTamboTokenUpdating(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          userToken: "oauth-token",
        }),
      });

      expect(result.current).toBe(true);
    });

    it("should expose isUpdatingToken=false when not fetching", () => {
      jest.mocked(useTamboSessionToken).mockReturnValue({
        isFetching: false,
      } as any);

      const { result } = renderHook(() => useIsTamboTokenUpdating(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      expect(result.current).toBe(false);
    });

    it("should call useTamboSessionToken with userToken when provided", () => {
      renderHook(() => useTamboClient(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          userToken: "my-oauth-token",
        }),
      });

      expect(useTamboSessionToken).toHaveBeenCalledWith(
        expect.anything(), // client
        expect.anything(), // queryClient
        "my-oauth-token",
      );
    });
  });
});

describe("Hook Contracts", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetch.mockReset();

    global.fetch = mockFetch as unknown as typeof fetch;

    jest.mocked(useTamboSessionToken).mockReturnValue({
      isFetching: false,
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createWrapper = (props: { apiKey: string }) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TamboClientProvider {...props}>{children}</TamboClientProvider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
  };

  describe("useTamboClient", () => {
    it("should return client instance inside provider", () => {
      const { result } = renderHook(() => useTamboClient(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      expect(result.current).toBeDefined();
      expect(result.current.beta).toBeDefined();
    });

    it("should throw descriptive error outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useTamboClient());
      }).toThrow("useTamboClient must be used within a TamboClientProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("useTamboQueryClient", () => {
    it("should return QueryClient instance inside provider", () => {
      const { result } = renderHook(() => useTamboQueryClient(), {
        wrapper: createWrapper({ apiKey: "test-api-key" }),
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.getQueryCache).toBe("function");
    });

    it("should throw descriptive error outside provider", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useTamboQueryClient());
      }).toThrow(
        "useTamboQueryClient must be used within a TamboClientProvider",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("useIsTamboTokenUpdating", () => {
    it("should throw descriptive error outside provider", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useIsTamboTokenUpdating());
      }).toThrow(
        "useIsTamboTokenUpdating must be used within a TamboClientProvider",
      );

      consoleSpy.mockRestore();
    });
  });
});
