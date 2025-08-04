"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AdditionalContext,
  AdditionalContextHelper,
  ContextHelpersConfig,
  DEFAULT_CONTEXT_HELPERS,
} from "../context-helpers";

export interface TamboContextHelpersProviderProps {
  /** Configuration for which context helpers are enabled/disabled */
  contextHelpers?: ContextHelpersConfig;
}

export interface TamboContextHelpersContextProps {
  /** Get all enabled additional context */
  getAdditionalContext: () => Promise<AdditionalContext[]>;
  /** Get the current context helpers configuration */
  getContextHelpers: () => AdditionalContextHelper[];
  /** Update a specific context helper's enabled state */
  setContextHelperEnabled: (name: string, enabled: boolean) => void;
}

const TamboContextHelpersContext =
  createContext<TamboContextHelpersContextProps | null>(null);

/**
 * Provider for managing additional context helpers
 * @param children - The children of the provider
 * @param children.children - The children of the provider
 * @param children.contextHelpers - The configuration for which context helpers are enabled/disabled
 * @returns The context helpers context props
 */
export const TamboContextHelpersProvider: React.FC<
  PropsWithChildren<TamboContextHelpersProviderProps>
> = ({ children, contextHelpers }) => {
  // Initialize context helpers with configuration
  const [helpers, setHelpers] = useState<AdditionalContextHelper[]>(() => {
    return DEFAULT_CONTEXT_HELPERS.map((helper) => ({
      ...helper,
      enabled:
        contextHelpers?.[helper.name as keyof ContextHelpersConfig] ??
        helper.enabled,
    }));
  });

  const getAdditionalContext = useCallback(async () => {
    const contextResults: AdditionalContext[] = [];

    for (const helper of helpers) {
      if (helper.enabled) {
        try {
          const context = await helper.run();
          contextResults.push(context);
        } catch (error) {
          console.error(`Error running context helper ${helper.name}:`, error);
        }
      }
    }

    return contextResults;
  }, [helpers]);

  const getContextHelpers = useCallback(() => {
    return helpers;
  }, [helpers]);

  const setContextHelperEnabled = useCallback(
    (name: string, enabled: boolean) => {
      setHelpers((prev) =>
        prev.map((helper) =>
          helper.name === name ? { ...helper, enabled } : helper,
        ),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      getAdditionalContext,
      getContextHelpers,
      setContextHelperEnabled,
    }),
    [getAdditionalContext, getContextHelpers, setContextHelperEnabled],
  );

  return (
    <TamboContextHelpersContext.Provider value={value}>
      {children}
    </TamboContextHelpersContext.Provider>
  );
};

/**
 * Hook to access context helpers functionality
 * @returns The context helpers context props
 */
export const useTamboContextHelpers = () => {
  const context = useContext(TamboContextHelpersContext);
  if (!context) {
    throw new Error(
      "useTamboContextHelpers must be used within a TamboContextHelpersProvider",
    );
  }
  return context;
};
