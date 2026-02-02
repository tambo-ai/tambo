/**
 * Debounced callback with flush capability
 */
export interface DebouncedCallback<Args extends unknown[]> {
  (...args: Args): void;
  flush(): void;
  cancel(): void;
}

/**
 * Create a debounced callback that delays execution until after the specified
 * wait time has elapsed since the last call. Includes flush() to immediately
 * execute any pending call.
 * @param fn - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function with flush and cancel methods
 */
export function createDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => unknown,
  wait: number,
): DebouncedCallback<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  function execute(): void {
    if (pendingArgs !== null) {
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  }

  function debounced(...args: Args): void {
    pendingArgs = args;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      execute();
    }, wait);
  }

  debounced.flush = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    execute();
  };

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  return debounced;
}
