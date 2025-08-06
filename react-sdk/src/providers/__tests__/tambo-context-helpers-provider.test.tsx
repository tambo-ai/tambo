import { act, renderHook } from "@testing-library/react";
import React from "react";
import * as contextHelpers from "../../context-helpers";
import { DEFAULT_CONTEXT_HELPERS } from "../../context-helpers";
import {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "../tambo-context-helpers-provider";

/**
 * Test suite for TamboContextHelpersProvider
 *
 * This suite tests the context helpers system that allows automatic injection
 * of additional context into messages sent to Tambo. It covers:
 * - Built-in context helpers (userTime, userPage)
 * - Custom context helpers
 * - Dynamic helper management
 * - Error handling
 * - Configuration options
 */
describe("TamboContextHelpersProvider", () => {
  // Create a wrapper component that provides the context for testing hooks
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TamboContextHelpersProvider>{children}</TamboContextHelpersProvider>
  );

  describe("useTamboContextHelpers", () => {
    /**
     * Test: Hook throws error when used outside of provider
     * This ensures developers get a clear error message if they forget to wrap
     * their components with the TamboContextHelpersProvider
     */
    it("should throw error when used outside provider", () => {
      // Mock console.error to prevent error output in test logs
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Verify that using the hook without a provider throws the expected error
      expect(() => {
        renderHook(() => useTamboContextHelpers());
      }).toThrow(
        "useTamboContextHelpers must be used within a TamboContextHelpersProvider",
      );

      // Restore console.error to its original implementation
      consoleSpy.mockRestore();
    });

    /**
     * Test: Hook provides the expected API functions
     * Verifies that all required functions are available when the hook is used
     * within the provider context
     */
    it("should provide context helpers functions", () => {
      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper,
      });

      // Verify all expected functions are present in the hook's return value
      expect(result.current).toHaveProperty("getAdditionalContext");
      expect(result.current).toHaveProperty("getContextHelpers");
      expect(result.current).toHaveProperty("setContextHelperEnabled");
    });

    /**
     * Test: Default configuration is applied correctly
     * Ensures that the default context helpers are loaded with their
     * expected enabled/disabled states
     */
    it("should return default context helpers configuration", () => {
      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper,
      });

      const helpers = result.current.getContextHelpers();

      // Verify we have the expected number of default helpers
      expect(helpers).toHaveLength(DEFAULT_CONTEXT_HELPERS.length);

      // Check specific helpers have their expected default states
      const userTimeHelper = helpers.find((h) => h.name === "userTime");
      const userPageHelper = helpers.find((h) => h.name === "userPage");

      // userTime should be disabled by default
      expect(userTimeHelper?.enabled).toBe(false);
      // userPage should be disabled by default
      expect(userPageHelper?.enabled).toBe(false);
    });

    /**
     * Test: Context helper enabled state can be toggled
     * Verifies that the setContextHelperEnabled function correctly updates
     * the enabled state of individual helpers
     */
    it("should allow toggling context helper enabled state", () => {
      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper,
      });

      // Enable the userPage helper using the provided function
      act(() => {
        result.current.setContextHelperEnabled("userPage", true);
      });

      // Verify the helper's state was updated
      const helpers = result.current.getContextHelpers();
      const userPageHelper = helpers.find((h) => h.name === "userPage");

      expect(userPageHelper?.enabled).toBe(true);
    });

    /**
     * Test: Only enabled helpers contribute to additional context
     * Verifies that getAdditionalContext only runs and returns data from
     * helpers that are currently enabled
     */
    it("should get additional context from enabled helpers", async () => {
      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper,
      });

      const contexts = await result.current.getAdditionalContext();

      // By default, no context helpers are enabled, so we should get no contexts
      expect(contexts).toHaveLength(0);
    });

    /**
     * Test: Provider respects configuration prop
     * Verifies that initial configuration can be customized through the
     * contextHelpers prop on the provider
     */
    it("should respect contextHelpers configuration prop", () => {
      // Create a custom wrapper with specific configuration
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            userTime: false, // Disable userTime
            userPage: true, // Enable userPage
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      );

      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper: customWrapper,
      });

      // Verify the custom configuration is applied
      const helpers = result.current.getContextHelpers();
      const userTimeHelper = helpers.find((h) => h.name === "userTime");
      const userPageHelper = helpers.find((h) => h.name === "userPage");

      expect(userTimeHelper?.enabled).toBe(false);
      expect(userPageHelper?.enabled).toBe(true);
    });

    /**
     * Test: Errors in context helpers are handled gracefully
     * Verifies that if a context helper throws an error, it doesn't crash
     * the entire system and other helpers continue to work
     */
    it("should handle errors in context helper functions gracefully", async () => {
      // Mock console.error to capture error logs
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Create a helper that will throw an error when run
      const errorHelper = {
        name: "errorHelper",
        enabled: true,
        run: () => {
          throw new Error("Test error");
        },
      };

      // Temporarily add the error helper to the default helpers
      // Store original helpers to restore later
      const originalHelpers = DEFAULT_CONTEXT_HELPERS;
      Object.defineProperty(contextHelpers, "DEFAULT_CONTEXT_HELPERS", {
        value: [...originalHelpers, errorHelper],
        writable: true,
      });

      const { result } = renderHook(() => useTamboContextHelpers(), {
        wrapper,
      });

      // Call getAdditionalContext, which should handle the error gracefully
      const contexts = await result.current.getAdditionalContext();

      // Should have no contexts because the error helper should be skipped
      expect(contexts.length).toBe(0);

      // Verify that the error was logged appropriately
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error running context helper errorHelper"),
        expect.any(Error),
      );

      // Restore the original helpers and console.error
      Object.defineProperty(contextHelpers, "DEFAULT_CONTEXT_HELPERS", {
        value: originalHelpers,
        writable: true,
      });
      consoleErrorSpy.mockRestore();
    });
  });
});

/**
 * Test suite for Custom Context Helpers
 *
 * Tests the ability to add custom context helpers that automatically inject
 * application-specific data into messages. This feature allows developers to:
 * - Add their own context helpers alongside built-in ones
 * - Override built-in helpers with custom implementations
 * - Dynamically manage helpers at runtime
 * - Configure helpers with enabled/disabled states
 */
describe("Custom Context Helpers via contextHelpers config", () => {
  /**
   * Test: Custom helpers can be added through provider configuration
   *
   * Verifies that developers can add custom context helpers via the
   * contextHelpers prop, and that these helpers work alongside built-in ones.
   * The key used in the configuration becomes the context name.
   */
  it("should accept custom helpers through contextHelpers config", async () => {
    const customHelper = {
      enabled: true,
      run: async () => ({ custom: "value" }),
    };

    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            userTime: true,
            userPage: false,
            customData: customHelper,
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const helpers = result.current.getContextHelpers();

    // Check built-in helpers
    expect(helpers.find((h) => h.name === "userTime")?.enabled).toBe(true);
    expect(helpers.find((h) => h.name === "userPage")?.enabled).toBe(false);

    // Check custom helper
    const custom = helpers.find((h) => h.name === "customData");
    expect(custom).toBeDefined();
    expect(custom?.enabled).toBe(true);

    // Test that it runs correctly
    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "customData",
      context: { custom: "value" },
    });
  });

  /**
   * Test: Built-in helpers can be overridden with custom implementations
   *
   * Ensures that developers can replace built-in helpers (like userTime)
   * with their own custom implementations by using the same key name.
   * This is useful for customizing the format or content of built-in contexts.
   */
  it("should allow custom helpers to override built-in ones", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            userTime: {
              enabled: true,
              run: async () => ({ customTime: "override" }),
            },
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
   * Test: Helpers can be added dynamically at runtime
   *
   * Verifies that the addContextHelper function allows adding new context
   * helpers after the provider has been initialized. This enables dynamic
   * context management based on application state or user actions.
   */
  it("should handle dynamic addition of custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider contextHelpers={{}}>
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    act(() => {
      result.current.addContextHelper("dynamicHelper", {
        run: async () => ({ dynamic: true }),
      });
    });

    const helpers = result.current.getContextHelpers();
    expect(helpers.find((h) => h.name === "dynamicHelper")).toBeDefined();

    // Verify it runs correctly
    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "dynamicHelper",
      context: { dynamic: true },
    });
  });

  /**
   * Test: Helpers can be removed dynamically
   *
   * Ensures that the removeContextHelper function properly removes helpers
   * from the system, preventing them from running and contributing context.
   * This is useful for cleanup or disabling features at runtime.
   */
  it("should handle dynamic removal of context helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            customHelper: {
              run: async () => ({ test: "data" }),
            },
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    // Verify helper exists
    let helpers = result.current.getContextHelpers();
    expect(helpers.find((h) => h.name === "customHelper")).toBeDefined();

    // Remove the helper
    act(() => {
      result.current.removeContextHelper("customHelper");
    });

    // Verify helper is removed
    helpers = result.current.getContextHelpers();
    expect(helpers.find((h) => h.name === "customHelper")).toBeUndefined();
  });

  /**
   * Test: Custom helpers respect the enabled flag
   *
   * Verifies that custom helpers with enabled: false are registered but
   * don't run or contribute context. This allows pre-configuring helpers
   * that can be enabled later via setContextHelperEnabled.
   */
  it("should respect enabled: false for custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            disabledHelper: {
              enabled: false,
              run: async () => ({ should: "not run" }),
            },
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const helpers = result.current.getContextHelpers();
    const disabledHelper = helpers.find((h) => h.name === "disabledHelper");
    expect(disabledHelper?.enabled).toBe(false);

    // Verify it doesn't run when disabled
    const contexts = await result.current.getAdditionalContext();
    expect(contexts.find((c) => c.name === "disabledHelper")).toBeUndefined();
  });

  /**
   * Test: Multiple custom helpers work together
   *
   * Ensures that multiple custom helpers can be configured simultaneously
   * and that they all contribute their context independently. Also verifies
   * that disabled helpers among them don't contribute context.
   */
  it("should handle multiple custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            helper1: {
              run: async () => ({ data: "one" }),
            },
            helper2: {
              run: async () => ({ data: "two" }),
            },
            helper3: {
              enabled: false,
              run: async () => ({ data: "three" }),
            },
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const contexts = await result.current.getAdditionalContext();

    // Should include enabled helpers
    expect(contexts).toContainEqual({
      name: "helper1",
      context: { data: "one" },
    });
    expect(contexts).toContainEqual({
      name: "helper2",
      context: { data: "two" },
    });

    // Should not include disabled helper
    expect(contexts.find((c) => c.name === "helper3")).toBeUndefined();
  });

  /**
   * Test: Both synchronous and asynchronous helpers are supported
   *
   * Verifies that context helpers can return their data either synchronously
   * or asynchronously (via Promises), and both work correctly. This flexibility
   * allows helpers to fetch data from APIs or perform async computations.
   */
  it("should handle sync and async custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            syncHelper: {
              run: () => ({ sync: true }),
            },
            asyncHelper: {
              run: async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                return { async: true };
              },
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
   * Test: Configuration key becomes the context name
   *
   * Confirms that the key used in the contextHelpers configuration object
   * becomes the name of the context in messages. This eliminates the need
   * to specify the name twice and makes the API more intuitive.
   */
  it("should use key name as context name for custom helpers", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            myCustomKey: {
              run: async () => ({ value: "test" }),
            },
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const helpers = result.current.getContextHelpers();
    const customHelper = helpers.find((h) => h.name === "myCustomKey");
    expect(customHelper).toBeDefined();

    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "myCustomKey", // Key becomes the name
      context: { value: "test" },
    });
  });

  /**
   * Test: Errors in custom helpers don't crash the system
   *
   * Ensures that if a custom helper throws an error, it's caught and logged,
   * but doesn't prevent other helpers from running or crash the application.
   * This provides resilience against faulty helper implementations.
   */
  it("should handle errors in custom helpers gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            errorHelper: {
              run: async () => {
                throw new Error("Custom helper error");
              },
            },
            goodHelper: {
              run: async () => ({ good: "data" }),
            },
          }}
        >
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    const contexts = await result.current.getAdditionalContext();

    // Should still get the good helper's context
    expect(contexts).toContainEqual({
      name: "goodHelper",
      context: { good: "data" },
    });

    // Should not get the error helper's context
    expect(contexts.find((c) => c.name === "errorHelper")).toBeUndefined();

    // Should log the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error running context helper errorHelper"),
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: Removing non-existent helpers doesn't throw
   *
   * Verifies that calling removeContextHelper with a name that doesn't
   * exist is handled gracefully without throwing errors. This makes the
   * API more forgiving and easier to use in cleanup scenarios.
   */
  it("should handle removing non-existent helper gracefully", () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider contextHelpers={{}}>
          {children}
        </TamboContextHelpersProvider>
      ),
    });

    // Should not throw when removing non-existent helper
    expect(() => {
      act(() => {
        result.current.removeContextHelper("nonExistent");
      });
    }).not.toThrow();
  });

  /**
   * Test: Existing helpers can be updated/replaced
   *
   * Confirms that calling addContextHelper with an existing helper name
   * replaces the old helper with the new one. This allows updating helper
   * logic at runtime without needing to remove and re-add.
   */
  it("should allow updating existing helper via addContextHelper", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: ({ children }) => (
        <TamboContextHelpersProvider
          contextHelpers={{
            testHelper: {
              run: async () => ({ original: true }),
            },
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
      result.current.addContextHelper("testHelper", {
        run: async () => ({ updated: true }),
      });
    });

    // Verify updated helper
    contexts = await result.current.getAdditionalContext();
    expect(contexts).toContainEqual({
      name: "testHelper",
      context: { updated: true },
    });
  });
});
