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
 * Configuration for context helpers
 */
export interface ContextHelpersConfig {
  /** Enable/disable user time context helper */
  userTime?: boolean;
  /** Enable/disable user page context helper */
  userPage?: boolean;
}
