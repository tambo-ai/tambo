"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  AdditionalContext,
  ContextHelpers,
  ContextHelperFn,
} from "../context-helpers";
import {
  addHelper,
  getHelpers,
  removeHelper as removeGlobalHelper,
  resolveAdditionalContext,
} from "../context-helpers/registry";

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
  // Hydrate the global registry with initial helpers (runs on prop changes)
  React.useEffect(() => {
    const addedEntries: [string, ContextHelperFn][] = [];

    if (contextHelpers) {
      for (const [name, fn] of Object.entries(contextHelpers)) {
        addHelper(name, fn);
        addedEntries.push([name, fn]);
      }
    }

    return () => {
      const current = getHelpers();
      for (const [name, fn] of addedEntries) {
        // Only remove if the registry still points to the same function
        if (current[name] === fn) {
          removeGlobalHelper(name);
        }
      }
    };
  }, [contextHelpers]);

  const getAdditionalContext = useCallback(async () => {
    const contexts = await resolveAdditionalContext();
    return contexts as AdditionalContext[];
  }, []);

  const getContextHelpers = useCallback(() => {
    return getHelpers() as ContextHelpers;
  }, []);

  const addContextHelper = useCallback(
    (name: string, helper: ContextHelperFn) => {
      addHelper(name, helper);
    },
    [],
  );

  const removeContextHelper = useCallback((name: string) => {
    removeGlobalHelper(name);
  }, []);

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
 * Safe to call even when no provider is present: proxies to the global registry.
 * @returns The context helpers context props (registry-backed).
 */
export const useTamboContextHelpers = () => {
  const context = useContext(TamboContextHelpersContext);
  if (context) return context;

  // Fallback to global registry so the API is standalone outside any provider
  return {
    getAdditionalContext: async () =>
      (await resolveAdditionalContext()) as AdditionalContext[],
    getContextHelpers: () => getHelpers() as ContextHelpers,
    addContextHelper: (name: string, helper: ContextHelperFn) =>
      addHelper(name, helper),
    removeContextHelper: (name: string) => removeGlobalHelper(name),
  } as TamboContextHelpersContextProps;
};
