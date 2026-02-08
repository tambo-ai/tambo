"use client";

/**
 * useTamboThreadInput - Thread Input Hook for v1 API
 *
 * Re-exports the shared thread input hook from the provider.
 * This hook uses shared context, enabling features like suggestions
 * to update the input field directly.
 *
 * For direct thread control without shared state, use useTamboSendMessage instead.
 */

export {
  useTamboThreadInput,
  type TamboThreadInputContextProps,
  type SubmitOptions,
} from "../providers/tambo-v1-thread-input-provider";
