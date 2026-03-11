/**
 * Retries an async operation with exponential backoff.
 *
 * @returns The result of the operation, or undefined if all retries are exhausted.
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T | undefined>,
  options: {
    maxRetries: number;
    initialDelayMs: number;
    backoffMultiplier: number;
  },
): Promise<T | undefined> {
  const { maxRetries, initialDelayMs, backoffMultiplier } = options;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await operation();
    if (result !== undefined) {
      return result;
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  return undefined;
}
