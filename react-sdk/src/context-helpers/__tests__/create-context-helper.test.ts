import { createContextHelper } from "../index";

/**
 * Test suite for createContextHelper utility function
 *
 * The createContextHelper function is a utility that simplifies the creation
 * of custom context helper configurations. It provides a clean API for
 * developers to create context helpers without manually structuring the
 * configuration object.
 * @see createContextHelper
 */
describe("createContextHelper", () => {
  /**
   * Test: Basic helper configuration creation
   *
   * Verifies that createContextHelper produces a valid configuration object
   * with the required properties (enabled and run) and correct default values.
   */
  it("should create a context helper configuration", () => {
    const helper = createContextHelper(async () => ({
      test: "data",
    }));

    expect(helper).toHaveProperty("enabled");
    expect(helper).toHaveProperty("run");
    expect(helper.enabled).toBe(true); // Default to enabled
    expect(typeof helper.run).toBe("function");
  });

  /**
   * Test: Enabled parameter controls helper's initial state
   *
   * Ensures that the optional enabled parameter correctly sets the helper's
   * enabled state. When not provided, it defaults to true (enabled).
   * This allows developers to create pre-disabled helpers.
   */
  it("should respect enabled parameter", () => {
    const enabledHelper = createContextHelper(
      async () => ({ test: "data" }),
      true,
    );
    expect(enabledHelper.enabled).toBe(true);

    const disabledHelper = createContextHelper(
      async () => ({ test: "data" }),
      false,
    );
    expect(disabledHelper.enabled).toBe(false);
  });

  /**
   * Test: Synchronous functions are supported
   *
   * Verifies that createContextHelper works with synchronous functions
   * that return data immediately without using Promises or async/await.
   */
  it("should work with sync functions", () => {
    const helper = createContextHelper(() => ({
      sync: true,
    }));

    expect(helper).toHaveProperty("run");
    expect(typeof helper.run).toBe("function");
  });

  /**
   * Test: Asynchronous functions are supported
   *
   * Confirms that createContextHelper works with async functions that
   * return Promises. This enables helpers to fetch data from APIs or
   * perform other asynchronous operations.
   */
  it("should work with async functions", () => {
    const helper = createContextHelper(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { async: true };
    });

    expect(helper).toHaveProperty("run");
    expect(typeof helper.run).toBe("function");
  });

  /**
   * Test: Various return types are supported
   *
   * Verifies that createContextHelper accepts functions returning any type
   * of data, not just objects. This includes primitives like strings,
   * numbers, booleans, and arrays, providing maximum flexibility.
   */
  it("should work with functions returning primitives", () => {
    const stringHelper = createContextHelper(() => "simple string");
    const numberHelper = createContextHelper(() => 42);
    const booleanHelper = createContextHelper(() => true);
    const arrayHelper = createContextHelper(() => [1, 2, 3]);

    expect(stringHelper).toHaveProperty("run");
    expect(numberHelper).toHaveProperty("run");
    expect(booleanHelper).toHaveProperty("run");
    expect(arrayHelper).toHaveProperty("run");
  });

  /**
   * Test: Integration with TamboProvider
   *
   * Demonstrates how createContextHelper is intended to be used with
   * TamboProvider. Shows practical examples of creating helpers for
   * different use cases (session data, analytics) with different
   * enabled states.
   * @example
   * ```tsx
   * const sessionHelper = createContextHelper(async () => ({
   *   sessionId: getSessionId(),
   *   userId: getUserId()
   * }));
   *
   * <TamboProvider contextHelpers={{ session: sessionHelper }}>
   * ```
   */
  it("should be usable with TamboProvider", () => {
    const sessionHelper = createContextHelper(async () => ({
      sessionId: "abc123",
      userId: "user456",
    }));

    const analyticsHelper = createContextHelper(
      () => ({
        pageViews: 10,
        sessionDuration: 300,
      }),
      false, // Start disabled
    );

    // This would be used like:
    // <TamboProvider
    //   contextHelpers={{
    //     session: sessionHelper,
    //     analytics: analyticsHelper,
    //   }}
    // >

    expect(sessionHelper.enabled).toBe(true);
    expect(analyticsHelper.enabled).toBe(false);
  });
});
