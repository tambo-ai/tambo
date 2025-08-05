import { act, renderHook } from "@testing-library/react";
import React from "react";
import * as contextHelpers from "../../context-helpers";
import { DEFAULT_CONTEXT_HELPERS } from "../../context-helpers";
import {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "../tambo-context-helpers-provider";

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
