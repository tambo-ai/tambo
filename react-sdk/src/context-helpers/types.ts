/**
 * Interface for additional context that can be added to messages
 */
export interface AdditionalContext {
  /** The name of the context type */
  name: string;
  /** The context data */
  context: unknown;
}

/**
 * A context helper is a function that returns data to include in the context,
 * or null/undefined to skip including anything.
 */
export type ContextHelperFn = () =>
  | unknown
  | null
  | undefined
  | Promise<unknown | null | undefined>;

/**
 * A collection of context helpers keyed by their context name.
 * The key becomes the AdditionalContext.name sent to the model.
 */
export type ContextHelpers = Record<string, ContextHelperFn>;
