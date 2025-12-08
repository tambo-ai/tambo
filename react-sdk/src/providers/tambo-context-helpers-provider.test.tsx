import { act, renderHook } from "@testing-library/react";
import React from "react";
import {
  currentPageContextHelper,
  currentTimeContextHelper,
} from "../context-helpers";
import {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "./tambo-context-helpers-provider";

/**
 * Test suite for TamboContextHelpersProvider (simplified API, registry-backed)
 *
 * The simplified API:
 * - Accepts a plain map of { key: () => any | null | undefined | Promise<any | null | undefined> }.
 * - The key becomes the context name sent to the model.
 * - Returning null/undefined from a helper skips inclusion.
 * - Prebuilt helpers are just functions (e.g., prebuiltUserTime, prebuiltUserPage).
 *
 * The hook is now registry-backed and safe to call outside a provider. When used
 * outside a provider, it proxies to a global registry and still works.
 */
describe("TamboContextHelpersProvider", () => {
  // Ensure registry is clean for each test to avoid cross-test contamination
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Base wrapper with no helpers provided
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TamboContextHelpersProvider>{children}</TamboContextHelpersProvider>
  );

  describe("useTamboContextHelpers", () => {
    /**
     * Verifies that the hook returns the expected API functions when used within a provider.
     */
    it("should provide context helpers functions (inside provider)", () => {
      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper,
      });
      expect(result.current).toHaveProperty("getAdditionalContext");
      expect(result.current).toHaveProperty("getContextHelpers");
      expect(result.current).toHaveProperty("addContextHelper");
      expect(result.current).toHaveProperty("removeContextHelper");
    });

    /**
     * With no helpers provided, no additional context should be returned.
     */
    it("should return no additional context when no helpers are provided", async () => {
      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper,
      });
      const contexts = await result.current.getAdditionalContext();
      expect(contexts).toHaveLength(0);
    });

    /**
     * When helpers are provided, getAdditionalContext should aggregate them.
     * Note: prebuiltUserPage may be null in non-browser envs, so we only assert userTime when present.
     */
    it("should get additional context when helpers are provided", async () => {
      const withHelpers = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            userTime: currentTimeContextHelper,
            userPage: currentPageContextHelper,
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      );

      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper: withHelpers,
      });

      const contexts = await result.current.getAdditionalContext();
      const names = contexts.map((c) => c.name);

      // userTime should be present from prebuilt helper
      expect(names).toContain("userTime");
      // userPage may be absent on server; do not assert strictly
    });

    /**
     * Errors thrown by helper functions should be caught and skipped, not crash the system.
     */
    it("should handle errors in context helper functions gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const badHelper = () => {
        throw new Error("Test error");
      };

      const withBadHelper = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider contextHelpers={{ badHelper }}>
          {children}
        </TamboContextHelpersProvider>
      );

      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper: withBadHelper,
      });

      const contexts = await result.current.getAdditionalContext();
      expect(contexts.length).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error running context helper badHelper"),
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });
});

/**
 * Test suite for Custom Context Helpers using the simplified API.
 *
 * Focuses on:
 * - Passing custom helpers via the provider prop.
 * - Overriding prebuilt helpers with custom implementations.
 * - Dynamic add/remove helper management at runtime.
 * - Supporting both sync and async helpers.
 * - Using the config key as the context name.
 * - Graceful error handling for custom helpers.
 */
describe("Custom Context Helpers via contextHelpers config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Custom helpers can be added through the provider configuration.
   * The key becomes the context name and the function returns the raw value.
   */
  it("should accept custom helpers through contextHelpers config", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            customData: async () => ({ custom: "value" }),
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "customData",
      context: { custom: "value" },
    });
  });

  /**
   * Built-in helpers can be overridden by providing a function under the same key.
   */
  it("should allow custom helpers to override built-in ones", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            userTime: async () => ({ customTime: "override" }),
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const contexts = await result.current.getAdditionalContext();
    const userTimeContext = contexts.find((c) => c.name === "userTime");
    expect(userTimeContext?.context).toEqual({ customTime: "override" });
  });

  /**
   * Helpers can be added dynamically at runtime via addContextHelper.
   */
  it("should handle dynamic addition of custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider contextHelpers={{}}>
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    // Initially none
    expect(await result.current.getAdditionalContext()).toHaveLength(0);

    act(() => {
      result.current.addContextHelper("dynamicHelper", async () => ({
        dynamic: true,
      }));
    });

    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "dynamicHelper",
      context: { dynamic: true },
    });
  });

  /**
   * Helpers can be removed dynamically via removeContextHelper.
   */
  it("should handle dynamic removal of context helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            customHelper: async () => ({ test: "data" }),
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    // Verify exists
    let contexts = await result.current.getAdditionalContext();
    expect(contexts.find((c) => c.name === "customHelper")).toBeDefined();

    // Remove
    act(() => {
      result.current.removeContextHelper("customHelper");
    });

    // Verify removed
    contexts = await result.current.getAdditionalContext();
    expect(contexts.find((c) => c.name === "customHelper")).toBeUndefined();
  });

  /**
   * Multiple custom helpers should be supported; helpers returning null/undefined are skipped.
   */
  it("should handle multiple custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            helper1: async () => ({ data: "one" }),
            helper2: async () => ({ data: "two" }),
            helper3: () => null, // disabled by returning null
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "helper1",
      context: { data: "one" },
    });
    expect(contexts).toContainEqual({
      name: "helper2",
      context: { data: "two" },
    });
    expect(contexts.find((c) => c.name === "helper3")).toBeUndefined();
  });

  /**
   * Both synchronous and asynchronous helpers should be supported.
   */
  it("should handle sync and async custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            syncHelper: () => ({ sync: true }),
            asyncHelper: async () => {
              await new Promise((resolve) => setTimeout(resolve, 10));
              return { async: true };
            },
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "syncHelper",
      context: { sync: true },
    });
    expect(contexts).toContainEqual({
      name: "asyncHelper",
      context: { async: true },
    });
  });

  /**
   * The key used in the contextHelpers map becomes the context name.
   */
  it("should use key name as context name for custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            myCustomKey: async () => ({ value: "test" }),
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "myCustomKey",
      context: { value: "test" },
    });
  });

  /**
   * Errors thrown by custom helpers should be logged and skipped, not crash the system.
   */
  it("should handle errors in custom helpers gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            errorHelper: async () => {
              throw new Error("Custom helper error");
            },
            goodHelper: async () => ({ good: "data" }),
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "goodHelper",
      context: { good: "data" },
    });
    expect(contexts.find((c) => c.name === "errorHelper")).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error running context helper errorHelper"),
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  /**
   * Removing non-existent helpers should be a no-op without throwing errors.
   */
  it("should handle removing non-existent helper gracefully", () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider contextHelpers={{}}>
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    expect(() => {
      act(() => {
        result.current.removeContextHelper("nonExistent");
      });
    }).not.toThrow();
  });

  /**
   * Adding with an existing name should update/replace the helper implementation.
   */
  it("should allow updating existing helper via addContextHelper", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            testHelper: async () => ({ original: true }),
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    // Verify original helper
    let contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "testHelper",
      context: { original: true },
    });

    // Update the helper
    act(() => {
      result.current.addContextHelper("testHelper", async () => ({
        updated: true,
      }));
    });

    // Verify updated helper
    contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "testHelper",
      context: { updated: true },
    });
  });
});
