import { renderHook } from "@testing-library/react";
import React from "react";
import {
  TamboClientProvider,
  TamboClientProviderProps,
  useIsTamboTokenUpdating,
  useTamboClient,
  useTamboQueryClient,
} from "./tambo-client-provider";

// Mock the session token hook to control token fetching state
jest.mock("./hooks/use-tambo-session-token", () => ({
  useTamboSessionToken: jest.fn(),
}));

import { useTamboSessionToken } from "./hooks/use-tambo-session-token";

// Add fetch polyfill for jsdom environment (TamboAI SDK requires it)
const mockFetch = jest.fn();
let previousFetch: typeof fetch;

beforeEach(() => {
  mockFetch.mockReset();
  previousFetch = global.fetch;
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = previousFetch;
});

describe("TamboClientProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  const createWrapper = (props: TamboClientProviderProps) => {
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

    it("should configure client with provided tamboUrl", () => {
      const { result } = renderHook(() => useTamboClient(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          tamboUrl: "https://custom.tambo.api",
        }),
      });

      expect(result.current.baseURL).toBe("https://custom.tambo.api");
    });

    it("should configure client with provided environment", async () => {
      const { result } = renderHook(() => useTamboClient(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          environment: "staging",
        }),
      });

      const { url } = await result.current.buildRequest({
        method: "get",
        path: "/test-endpoint",
      });

      expect(url).toBe("https://hydra-api-dev.up.railway.app/test-endpoint");
    });

    it("should throw if both tamboUrl and environment are provided", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useTamboClient(), {
          wrapper: createWrapper({
            apiKey: "test-api-key",
            tamboUrl: "https://custom.tambo.api",
            environment: "staging",
          }),
        });
      }).toThrow(
        "Ambiguous URL; The `baseURL` option (or TAMBO_AI_BASE_URL env var) and the `environment` option are given. If you want to use the environment you must pass baseURL: null",
      );

      consoleSpy.mockRestore();
    });

    it("should include additional headers in client configuration", async () => {
      const { result } = renderHook(() => useTamboClient(), {
        wrapper: createWrapper({
          apiKey: "test-api-key",
          additionalHeaders: {
            "X-Custom-Header": "custom-value",
            "X-Another-Header": "another-value",
          },
        }),
      });

      const { req } = await result.current.buildRequest({
        method: "get",
        path: "/test-endpoint",
      });

      expect(req.headers.get("X-Tambo-React-Version")).toBeDefined();
      expect(req.headers.get("X-Tambo-React-Version")).toMatch(/\d+\.\d+\.\d+/); // version format
      expect(req.headers.get("X-Custom-Header")).toBe("custom-value");
      expect(req.headers.get("X-Another-Header")).toBe("another-value");
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

    jest.mocked(useTamboSessionToken).mockReturnValue({
      isFetching: false,
    } as any);
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
