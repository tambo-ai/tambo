"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AdditionalContext,
  ContextHelperFn,
  ContextHelpers,
} from "../context-helpers";
import { resolveAdditionalContext } from "../context-helpers/registry";

export interface TamboContextHelpersProviderProps {
  /**
   * A dictionary of context helper functions.
   * The key becomes the AdditionalContext.name and the function returns the value.
   * Return null/undefined to skip including that context.
   */
  contextHelpers?: ContextHelpers;
}

export interface TamboContextHelpersContextProps {
  /** Get all additional context by running all helper functions */
  getAdditionalContext: () => Promise<AdditionalContext[]>;
  /** Get the current context helpers map */
  getContextHelpers: () => ContextHelpers;
  /** Add or update a context helper by name */
  addContextHelper: (name: string, helper: ContextHelperFn) => void;
  /** Remove a context helper by name */
  removeContextHelper: (name: string) => void;
}

const TamboContextHelpersContext =
  createContext<TamboContextHelpersContextProps | null>(null);

/**
 * Provider for managing additional context helpers.
 * Accepts a map of { key: () => any | null | undefined | Promise<any | null | undefined> }.
 * Returning null/undefined skips inclusion; returned values are wrapped as { name: key, context: value }.
 * @param props - The props for the TamboContextHelpersProvider.
 * @param props.contextHelpers - A dictionary of context helper functions keyed by context name.
 * @param props.children - The children to render.
 * @returns The provider that exposes context helper APIs via useTamboContextHelpers.
 */
export const TamboContextHelpersProvider: React.FC<
  PropsWithChildren<TamboContextHelpersProviderProps>
> = ({ children, contextHelpers }) => {
  const [helpers, setHelpers] = useState<Record<string, ContextHelperFn>>({});
  const addContextHelper = useCallback((name: string, fn: ContextHelperFn) => {
    setHelpers((prev) => ({ ...prev, [name]: fn }));
  }, []);
  const removeContextHelper = useCallback(
    (name: string, fn?: ContextHelperFn) => {
      setHelpers((prev) => {
        const { [name]: registeredFn, ...rest } = prev;
        if (fn === undefined || registeredFn === fn) {
          return rest;
        }
        return prev;
      });
    },
    [],
  );
  // Hydrate the global registry with initial helpers (runs on prop changes)
  useEffect(() => {
    const addedEntries: [string, ContextHelperFn][] = [];

    if (contextHelpers) {
      for (const [name, fn] of Object.entries(contextHelpers)) {
        addContextHelper(name, fn);
        addedEntries.push([name, fn]);
      }
    }

    return () => {
      for (const [name, fn] of addedEntries) {
        // Only remove if the registry still points to the same function
        removeContextHelper(name, fn);
      }
    };
  }, [addContextHelper, contextHelpers, removeContextHelper]);

  const getAdditionalContext = useCallback(async () => {
    const contexts = await resolveAdditionalContext(helpers);
    return contexts as AdditionalContext[];
  }, [helpers]);

  const getContextHelpers = useCallback(() => {
    return helpers as ContextHelpers;
  }, [helpers]);

  const value = useMemo(
    () => ({
      getAdditionalContext,
      getContextHelpers,
      addContextHelper,
      removeContextHelper,
    }),
    [
      getAdditionalContext,
      getContextHelpers,
      addContextHelper,
      removeContextHelper,
    ],
  );

  return (
    <TamboContextHelpersContext.Provider value={value}>
      {children}
    </TamboContextHelpersContext.Provider>
  );
};

/**
 * Hook to access context helpers functionality.
 *
 * Behavior without a provider: this hook does NOT throw immediately. If it is
 * called outside of a `TamboContextHelpersProvider`, it returns a fallback
 * object whose methods will throw when invoked. This "lazy-throw" pattern is
 * intentional so the error surfaces at the actual point of use.
 * @returns The context helpers API when a provider is present; otherwise, a
 * fallback object whose methods throw if called.
 */
export const useTamboContextHelpers = () => {
  const context = useContext(TamboContextHelpersContext);
  if (context) return context;

  // No provider present: return methods that throw with a helpful error when used
  return {
    getAdditionalContext: async () => {
      throw new Error(
        "useTamboContextHelpers must be used within a TamboContextHelpersProvider",
      );
    },
    getContextHelpers: () => {
      throw new Error(
        "useTamboContextHelpers must be used within a TamboContextHelpersProvider",
      );
    },
    addContextHelper: (_name: string, _helper: ContextHelperFn) => {
      throw new Error(
        "useTamboContextHelpers must be used within a TamboContextHelpersProvider",
      );
    },
    removeContextHelper: (_name: string) => {
      throw new Error(
        "useTamboContextHelpers must be used within a TamboContextHelpersProvider",
      );
    },
  } as TamboContextHelpersContextProps;
};
