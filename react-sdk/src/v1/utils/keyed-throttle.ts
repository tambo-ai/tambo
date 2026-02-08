/**
 * Keyed Throttle Utility
 *
 * A generic leading+trailing throttle that maintains independent timers per
 * string key. Fires immediately on the first call for a key, then at most
 * once per `delay` ms while calls keep arriving, with a trailing fire to
 * capture the final value.
 *
 * Useful when the same operation fires rapidly for multiple independent
 * entities (e.g., multiple concurrent tool calls during streaming).
 */

/**
 * A throttle controller with independent timers per key.
 */
export interface KeyedThrottle<T> {
  /** Schedule a throttled call for the given key. Fires immediately if idle, otherwise queues a trailing call. */
  schedule(key: string, value: T): void;
  /**
   * Force-execute all pending trailing calls immediately, cancel all timers,
   * and reset to idle. After flush(), the next schedule() for any key will
   * fire immediately (leading edge) as if the key were new.
   */
  flush(): void;
}

interface ThrottleEntry<T> {
  /** Latest value received while throttled */
  latestValue: T;
  /** Whether a new value arrived during the cooldown window */
  hasTrailing: boolean;
  /** The active cooldown timer, if any */
  timer?: ReturnType<typeof setTimeout>;
  /** Generation counter — incremented on flush/reschedule to invalidate stale callbacks */
  gen: number;
}

/**
 * Creates a keyed leading+trailing throttle.
 *
 * Each key gets its own independent throttle. On the first call for an idle
 * key, `fn` fires immediately (leading edge). Subsequent calls during the
 * cooldown window update the stored value. When the cooldown expires, if a
 * new value arrived, `fn` fires again with the latest value (trailing edge)
 * and the timer re-arms. This repeats until no new calls arrive during
 * a cooldown window, at which point the key becomes idle.
 *
 * Call `flush()` to force-execute all pending trailing calls, cancel all
 * timers, and reset to idle.
 * @param fn - Callback invoked with (key, latestValue) on leading and trailing edges
 * @param delay - Throttle interval in milliseconds
 * @returns KeyedThrottle controller
 */
export function createKeyedThrottle<T>(
  fn: (key: string, value: T) => void,
  delay: number,
): KeyedThrottle<T> {
  const pending = new Map<string, ThrottleEntry<T>>();

  function armTimer(key: string): void {
    const entry = pending.get(key);
    if (!entry || entry.timer) return;

    const myGen = entry.gen;
    entry.timer = setTimeout(() => {
      const current = pending.get(key);
      if (current?.gen !== myGen) return;

      current.timer = undefined;

      if (!current.hasTrailing) {
        // No new calls during cooldown — go idle
        pending.delete(key);
        return;
      }

      // Trailing fire with latest value
      current.hasTrailing = false;
      const trailingValue = current.latestValue;
      fn(key, trailingValue);

      // Re-arm only if more updates may arrive
      armTimer(key);
    }, delay);
  }

  function schedule(key: string, value: T): void {
    const existing = pending.get(key);
    if (existing) {
      // Currently in cooldown — update value, mark trailing
      existing.latestValue = value;
      existing.hasTrailing = true;
      armTimer(key);
    } else {
      // Idle — fire immediately (leading edge), start cooldown
      fn(key, value);
      pending.set(key, { latestValue: value, hasTrailing: false, gen: 0 });
      armTimer(key);
    }
  }

  function flush(): void {
    for (const [key, entry] of pending) {
      entry.gen++;
      if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = undefined;
      }
      if (entry.hasTrailing) {
        fn(key, entry.latestValue);
      }
    }
    pending.clear();
  }

  return { schedule, flush };
}
