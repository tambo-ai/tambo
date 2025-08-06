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
  CustomContextHelperConfig,
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
  /** Add or update a context helper dynamically */
  addContextHelper: (name: string, helper: CustomContextHelperConfig) => void;
  /** Remove a context helper by name */
  removeContextHelper: (name: string) => void;
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
    const allHelpers: AdditionalContextHelper[] = [];
    const processedNames = new Set<string>();

    // First, process default helpers
    DEFAULT_CONTEXT_HELPERS.forEach((helper) => {
      const config = contextHelpers?.[helper.name];

      if (config !== undefined) {
        if (typeof config === "boolean") {
          // Boolean config for built-in helper
          allHelpers.push({ ...helper, enabled: config });
        } else if (typeof config === "object" && config.run) {
          // Custom helper replacing built-in one
          allHelpers.push({
            name: helper.name,
            enabled: config.enabled ?? true,
            run: async () => ({
              name: helper.name,
              context: await config.run(),
            }),
          });
        }
      } else {
        // No config provided, use default
        allHelpers.push(helper);
      }
      processedNames.add(helper.name);
    });

    // Then, process any additional custom helpers
    if (contextHelpers) {
      Object.entries(contextHelpers).forEach(([name, config]) => {
        if (!processedNames.has(name) && config !== undefined) {
          if (typeof config === "object" && config.run) {
            // Custom helper
            allHelpers.push({
              name,
              enabled: config.enabled ?? true,
              run: async () => ({
                name,
                context: await config.run(),
              }),
            });
          }
          // Ignore boolean values for non-built-in helpers
        }
      });
    }

    return allHelpers;
  });

  const getAdditionalContext = useCallback(async () => {
    const contexts = await Promise.all(
      helpers
        .filter((helper) => helper.enabled)
        .map(async (helper) => {
          try {
            return await helper.run();
          } catch (error) {
            console.error(
              `Error running context helper ${helper.name}:`,
              error,
            );
            return undefined;
          }
        }),
    );

    // Filter out any undefined results from errors
    return contexts.filter(Boolean) as AdditionalContext[];
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

  const addContextHelper = useCallback(
    (name: string, helper: CustomContextHelperConfig) => {
      setHelpers((prev) => {
        const existingIndex = prev.findIndex((h) => h.name === name);
        const newHelper: AdditionalContextHelper = {
          name,
          enabled: helper.enabled ?? true,
          run: async () => ({
            name,
            context: await helper.run(),
          }),
        };

        if (existingIndex >= 0) {
          // Update existing helper
          const updated = [...prev];
          updated[existingIndex] = newHelper;
          return updated;
        } else {
          // Add new helper
          return [...prev, newHelper];
        }
      });
    },
    [],
  );

  const removeContextHelper = useCallback((name: string) => {
    setHelpers((prev) => prev.filter((helper) => helper.name !== name));
  }, []);

  const value = useMemo(
    () => ({
      getAdditionalContext,
      getContextHelpers,
      setContextHelperEnabled,
      addContextHelper,
      removeContextHelper,
    }),
    [
      getAdditionalContext,
      getContextHelpers,
      setContextHelperEnabled,
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
