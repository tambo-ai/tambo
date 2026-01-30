"use client";

/**
 * useTamboV1ThreadInput - Thread Input Hook for v1 API
 *
 * Re-exports the shared thread input hook from the provider.
 * This hook uses shared context, enabling features like suggestions
 * to update the input field directly.
 *
 * For direct thread control without shared state, use useTamboV1SendMessage instead.
 */

export {
  useTamboV1ThreadInput,
  type TamboV1ThreadInputContextProps,
  type SubmitOptions,
} from "../providers/tambo-v1-thread-input-provider";
