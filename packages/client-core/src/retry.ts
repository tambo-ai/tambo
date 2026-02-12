/**
 * Retry wrapper with exponential backoff
 */

import { backOff } from "exponential-backoff";
import type { IBackOffOptions } from "exponential-backoff";
import { ApiError } from "./types.js";

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (defaults to 3) */
  numOfAttempts?: number;
  /** Starting delay in milliseconds (defaults to 1000) */
  startingDelay?: number;
  /** Maximum delay in milliseconds (defaults to 30000) */
  maxDelay?: number;
  /** Jitter strategy (defaults to "full") */
  jitter?: "none" | "full";
}

/**
 * Wraps a fetch operation with exponential backoff retry logic.
 * Only retries on network errors or 5xx status codes.
 * Does NOT retry on 4xx client errors.
 *
 * @param fn - Function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const backoffOptions: Partial<IBackOffOptions> = {
    numOfAttempts: options?.numOfAttempts ?? 3,
    startingDelay: options?.startingDelay ?? 1000,
    maxDelay: options?.maxDelay ?? 30000,
    jitter: options?.jitter ?? "full",
    retry: (error: unknown) => {
      // Network errors (TypeError, fetch failures) - retry
      if (error instanceof TypeError) {
        return true;
      }

      // API errors - only retry on 5xx
      if (error instanceof ApiError) {
        return error.status >= 500;
      }

      // Other errors - don't retry
      return false;
    },
  };

  return await backOff(fn, backoffOptions);
}
