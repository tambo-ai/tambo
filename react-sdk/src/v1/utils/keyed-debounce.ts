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
export interface KeyedDebounce<T> {
  /** Schedule a throttled call for the given key. Fires immediately if idle, otherwise queues a trailing call. */
  schedule(key: string, value: T): void;
  /** Force-execute all pending trailing calls immediately and clear timers. */
  flush(): void;
}

interface ThrottleEntry<T> {
  /** Latest value received while throttled */
  latestValue: T;
  /** Whether a new value arrived during the cooldown window */
  hasTrailing: boolean;
  /** The active cooldown timer */
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Creates a keyed leading+trailing throttle.
 *
 * Each key gets its own independent throttle. On the first call for an idle
 * key, `fn` fires immediately (leading edge). Subsequent calls during the
 * cooldown window update the stored value. When the cooldown expires, if a
 * new value arrived, `fn` fires again with the latest value (trailing edge)
 * and a new cooldown starts. This repeats until no new calls arrive during
 * a cooldown window.
 *
 * Call `flush()` to force-execute all pending trailing calls immediately.
 * @param fn - Callback invoked with (key, latestValue) on leading and trailing edges
 * @param delay - Throttle interval in milliseconds
 * @returns KeyedDebounce controller
 */
export function createKeyedDebounce<T>(
  fn: (key: string, value: T) => void,
  delay: number,
): KeyedDebounce<T> {
  const pending = new Map<string, ThrottleEntry<T>>();

  function startCooldown(key: string, value: T): void {
    const timer = setTimeout(() => {
      const entry = pending.get(key);
      if (entry?.hasTrailing) {
        // Trailing fire with latest value, then start new cooldown
        const trailingValue = entry.latestValue;
        pending.delete(key);
        fn(key, trailingValue);
        startCooldown(key, trailingValue);
      } else {
        // No new calls during cooldown — done
        pending.delete(key);
      }
    }, delay);

    pending.set(key, { latestValue: value, hasTrailing: false, timer });
  }

  function schedule(key: string, value: T): void {
    const existing = pending.get(key);
    if (existing) {
      // Currently in cooldown — update value, mark trailing
      existing.latestValue = value;
      existing.hasTrailing = true;
    } else {
      // Idle — fire immediately (leading edge), start cooldown
      fn(key, value);
      startCooldown(key, value);
    }
  }

  function flush(): void {
    for (const [key, entry] of pending) {
      clearTimeout(entry.timer);
      if (entry.hasTrailing) {
        fn(key, entry.latestValue);
      }
    }
    pending.clear();
  }

  return { schedule, flush };
}
