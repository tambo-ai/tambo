/**
 * Tests for the Context Helpers API.
 *
 * The new API treats a context helper as a plain function that returns a value
 * to include in context, or null/undefined to skip. The provider wraps each
 * value with its key name as { name, context } before sending with messages.
 *
 * This test suite validates that:
 *  - Helper functions can return sync/async values.
 *  - Returning null/undefined causes the helper to be skipped.
 *  - Errors in helpers are caught and skipped.
 *  - The provider aggregates helpers passed in its props and returns AdditionalContext[].
 */

import { act, renderHook } from "@testing-library/react";
import React, { PropsWithChildren } from "react";
import {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "../providers/tambo-context-helpers-provider";
import {
  type AdditionalContext,
  type ContextHelperFn,
  currentPageContextHelper,
  currentTimeContextHelper,
} from "./index";

/**
 * Test wrapper to provide the TamboContextHelpersProvider for hooks.
 * @param helpers - A dictionary of context helper functions.
 * @returns A wrapper component that provides the TamboContextHelpersProvider.
 */
function wrapper(helpers?: Record<string, ContextHelperFn>) {
  // eslint-disable-next-line react/display-name
  return ({ children }: PropsWithChildren) =>
    React.createElement(
      TamboContextHelpersProvider,
      {
        contextHelpers: helpers,
      },
      children,
    );
}

describe("Context Helpers API", () => {
  // Ensure the global registry doesn't leak state between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns empty array when no helpers provided", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: wrapper(),
    });

    const contexts = await result.current.getAdditionalContext();
    expect(Array.isArray(contexts)).toBe(true);
    expect(contexts).toHaveLength(0);
  });

  test("collects sync and async helper results", async () => {
    const syncHelper: ContextHelperFn = () => ({ a: 1 });
    const asyncHelper: ContextHelperFn = async () => ({ b: 2 });

    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: wrapper({
        sync: syncHelper,
        async: asyncHelper,
      }),
    });

    const contexts = await result.current.getAdditionalContext();

    // Validate shape and presence
    const byName = new Map(contexts.map((c) => [c.name, c.context]));
    expect(byName.get("sync")).toEqual({ a: 1 });
    expect(byName.get("async")).toEqual({ b: 2 });
  });

  test("skips null and undefined results", async () => {
    const nullHelper: ContextHelperFn = () => null;
    const undefinedHelper: ContextHelperFn = () => undefined;
    const validHelper: ContextHelperFn = () => ({ ok: true });

    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: wrapper({
        nullHelper,
        undefinedHelper,
        validHelper,
      }),
    });

    const contexts = await result.current.getAdditionalContext();
    const names = contexts.map((c) => c.name);

    expect(names).toContain("validHelper");
    expect(names).not.toContain("nullHelper");
    expect(names).not.toContain("undefinedHelper");
  });

  test("errors in helpers are caught and skipped", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {
      // silence expected error
    });

    const badHelper: ContextHelperFn = () => {
      throw new Error("boom");
    };
    const goodHelper: ContextHelperFn = () => ({ ok: 1 });

    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: wrapper({ badHelper, goodHelper }),
    });

    const contexts = await result.current.getAdditionalContext();
    expect(contexts).toHaveLength(1);
    expect(contexts[0]).toEqual<AdditionalContext>({
      name: "goodHelper",
      context: { ok: 1 },
    });

    consoleSpy.mockRestore();
  });

  test("dynamic add/remove helpers works", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: wrapper(),
    });

    // Initially empty
    expect(await result.current.getAdditionalContext()).toHaveLength(0);

    // Add
    act(() => {
      result.current.addContextHelper("dyn", () => ({ x: 10 }));
    });

    let contexts = await result.current.getAdditionalContext();
    expect(contexts).toHaveLength(1);
    expect(contexts[0]).toEqual<AdditionalContext>({
      name: "dyn",
      context: { x: 10 },
    });

    // Update
    act(() => {
      result.current.addContextHelper("dyn", () => ({ x: 20 }));
    });
    contexts = await result.current.getAdditionalContext();
    expect(contexts).toHaveLength(1);
    expect(contexts[0]).toEqual<AdditionalContext>({
      name: "dyn",
      context: { x: 20 },
    });

    // Remove
    act(() => {
      result.current.removeContextHelper("dyn");
    });
    contexts = await result.current.getAdditionalContext();
    expect(contexts).toHaveLength(0);
  });

  test("prebuilt helpers can be passed directly", async () => {
    const { result } = renderHook(() => useTamboContextHelpers(), {
      wrapper: wrapper({
        userTime: currentTimeContextHelper,
        userPage: currentPageContextHelper,
      }),
    });

    const contexts = await result.current.getAdditionalContext();

    // Should include both entries unless environment prevents userPage (SSR)
    const names = contexts.map((c) => c.name);
    expect(names).toContain("userTime");
    // userPage may be null on non-browser envs; allow either outcome:
    // if present, ensure expected keys exist
    if (names.includes("userPage")) {
      const userPage = contexts.find((c) => c.name === "userPage")!.context as {
        url?: string;
        title?: string;
      };
      expect(
        typeof userPage.url === "string" || userPage.url === undefined,
      ).toBe(true);
      expect(
        typeof userPage.title === "string" || userPage.title === undefined,
      ).toBe(true);
    }
  });
});
