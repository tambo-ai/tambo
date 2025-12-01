/**
 * Throttles a function to be called at most once every `updateIntervalMs` milliseconds.
 * @param callback - The function to throttle.
 * @param updateIntervalMs - The minimum time between function calls.
 * @returns A throttled function that will call the original function at most once every `updateIntervalMs` milliseconds.
 */
export function throttle<FN extends (...args: never[]) => Promise<unknown>>(
  callback: FN,
  updateIntervalMs: number,
): (...args: Parameters<FN>) => Promise<ReturnType<FN> | undefined> {
  let lastUpdateTime = 0;
  return async (
    ...args: Parameters<FN>
  ): Promise<ReturnType<FN> | undefined> => {
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime >= updateIntervalMs) {
      const result = await callback(...args);
      lastUpdateTime = currentTime;
      return result as ReturnType<FN>;
    }
  };
}
