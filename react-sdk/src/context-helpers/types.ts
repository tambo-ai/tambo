/**
 * Interface for additional context that can be added to messages
 */
export interface AdditionalContext {
  /** The name of the context type */
  name: string;
  /** The context data */
  context: any;
}

/**
 * Interface for a context helper that can generate additional context
 */
export interface AdditionalContextHelper {
  /** The name of the context helper */
  name: string;
  /** Whether this helper is enabled */
  enabled: boolean;
  /** Function that generates the additional context */
  run: () => AdditionalContext | Promise<AdditionalContext>;
}

/**
 * Custom context helper configuration that can be passed via contextHelpers
 */
export interface CustomContextHelperConfig<T = Record<string, unknown>> {
  /** Whether this helper is enabled (defaults to true) */
  enabled?: boolean;
  /** Function that generates the additional context */
  run: () => T | Promise<T>;
}

/**
 * Configuration for context helpers
 * Can be either:
 * - boolean: to enable/disable built-in helpers
 * - CustomContextHelperConfig: to add custom helpers or override built-in ones
 */
export interface ContextHelpersConfig {
  /** Enable/disable or override user time context helper */
  userTime?: boolean | CustomContextHelperConfig;
  /** Enable/disable or override user page context helper */
  userPage?: boolean | CustomContextHelperConfig;
  /** Custom context helpers - key is the helper name, value is the config */
  [key: string]: boolean | CustomContextHelperConfig | undefined;
}
