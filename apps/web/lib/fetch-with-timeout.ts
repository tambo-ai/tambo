/**
 * Creates a fetch function that enforces a per-request timeout.
 * Composes with any existing AbortSignal on the request via AbortSignal.any().
 *
 * @returns A fetch-compatible function with the timeout applied to every request.
 */
export function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = init?.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;
    return await fetch(input, { ...init, signal });
  };
}
