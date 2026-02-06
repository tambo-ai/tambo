/**
 * Keyed Debounce Utility
 *
 * A generic trailing debounce that maintains independent timers per string key.
 * Useful when the same operation fires rapidly for multiple independent entities
 * (e.g., multiple concurrent tool calls during streaming).
 */

/**
 * A debounce controller with independent timers per key.
 */
export interface KeyedDebounce<T> {
  /** Schedule a debounced call for the given key. Resets the timer if one is already pending. */
  schedule(key: string, value: T): void;
  /** Force-execute all pending debounced calls immediately and clear timers. */
  flush(): void;
}

/**
 * Creates a keyed trailing debounce.
 *
 * Each key gets its own independent timer. When `schedule` is called for a key
 * that already has a pending timer, the previous timer is cancelled and the
 * value is replaced. After `delay` ms of quiet for a given key, `fn` is called
 * with the key and the most recent value.
 *
 * Call `flush()` to force-execute all pending calls immediately.
 * @param fn - Callback invoked with (key, latestValue) when the debounce fires
 * @param delay - Debounce delay in milliseconds
 * @returns KeyedDebounce controller
 */
export function createKeyedDebounce<T>(
  fn: (key: string, value: T) => void,
  delay: number,
): KeyedDebounce<T> {
  const pending = new Map<
    string,
    { value: T; timer: ReturnType<typeof setTimeout> }
  >();

  function schedule(key: string, value: T): void {
    const existing = pending.get(key);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
      pending.delete(key);
      fn(key, value);
    }, delay);

    pending.set(key, { value, timer });
  }

  function flush(): void {
    for (const [key, { value, timer }] of pending) {
      clearTimeout(timer);
      fn(key, value);
    }
    pending.clear();
  }

  return { schedule, flush };
}
