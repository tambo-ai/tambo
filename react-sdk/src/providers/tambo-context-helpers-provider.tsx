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
import {
  DEFAULT_INTERACTABLES_CONTEXT_KEY,
  getCurrentInteractablesSnapshot,
} from "./tambo-interactable-provider";

// Module-level ownership tracking for the default "interactables" helper.
// This allows multiple providers to safely participate without overwriting
// each other and ensures correct teardown semantics on unmount.
let __tambo_defaultHelperUsers = 0;
let __tambo_defaultHelperFn: ContextHelperFn | null = null;

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
    // Track whether this provider instance is participating in the default
    // interactables helper so we can manage ownership/teardown safely.
    let usedDefaultHelper = false;

    if (contextHelpers) {
      for (const [name, fn] of Object.entries(contextHelpers)) {
        addHelper(name, fn);
        addedEntries.push([name, fn]);
      }
    }

    // Ensure a default interactables helper exists only when none exists.
    // In multi-provider scenarios, we must not overwrite an existing helper
    // (default or custom). We also track ownership so an unmount doesn't
    // remove a helper that other providers still rely on.
    const helpers = getHelpers();
    const current = helpers[DEFAULT_INTERACTABLES_CONTEXT_KEY];

    // Module-scoped ownership state
    // (defined below the component for hoisting clarity)
    if (!current) {
      const helperFn: ContextHelperFn = () => {
        const components = getCurrentInteractablesSnapshot();
        if (!components.length) return null;
        return {
          description:
            "These are interactable components currently available on the page. You can interact with them (e.g., by updating their props) if tools are available.",
          components: components.map((c) => ({
            id: c.id,
            componentName: c.name,
            description: c.description,
            props: c.props,
          })),
        };
      };
      (helperFn as any).__tambo_default_interactables_helper__ = true;
      addHelper(DEFAULT_INTERACTABLES_CONTEXT_KEY, helperFn);
      // Record ownership details locally; default helper is managed via ref-count
      usedDefaultHelper = true;
      __tambo_defaultHelperUsers += 1;
      __tambo_defaultHelperFn = helperFn;
    } else if (
      typeof current === "function" &&
      (current as any).__tambo_default_interactables_helper__ === true
    ) {
      // An existing default helper is already present; don't replace it but
      // join ownership so teardown is safe.
      usedDefaultHelper = true;
      __tambo_defaultHelperUsers += 1;
      __tambo_defaultHelperFn = current as ContextHelperFn;
    }

    return () => {
      const currentMap = getHelpers();
      for (const [name, fn] of addedEntries) {
        // Only remove if the registry still points to the same function
        if (currentMap[name] === fn) {
          removeGlobalHelper(name);
        }
      }

      // Default helper teardown: decrement usage and remove only if this was
      // the last participant and the registry still points to the same fn we
      // consider the default helper instance.
      if (usedDefaultHelper) {
        __tambo_defaultHelperUsers = Math.max(
          0,
          __tambo_defaultHelperUsers - 1,
        );
        if (__tambo_defaultHelperUsers === 0) {
          const fn = __tambo_defaultHelperFn;
          if (fn && currentMap[DEFAULT_INTERACTABLES_CONTEXT_KEY] === fn) {
            removeGlobalHelper(DEFAULT_INTERACTABLES_CONTEXT_KEY);
          }
          __tambo_defaultHelperFn = null;
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
