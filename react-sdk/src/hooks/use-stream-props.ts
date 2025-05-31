import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Lifecycle state for a streamed prop key.
 */
export type KeyState = "notStarted" | "streaming" | "complete" | "skipped";

/**
 * Metadata tracked for each expected key.
 */
export interface KeyMeta {
  state: KeyState;
  streamStartedAt?: number;
  streamCompletedAt?: number;
}

/**
 * A single token coming from the LLM stream.
 */
export interface StreamToken {
  key: string;
  value: string;
}

/**
 * Behaviour when a token arrives for an unexpected key.
 *
 *  - "ignore" (default): drop the token silently.
 *  - "throw":            throw an Error.
 */
export type UnknownKeyMode = "ignore" | "throw";

export interface UseStreamPropsOptions {
  onUnknownKey?: UnknownKeyMode;
}

export interface StreamPropsResult {
  /**
   * Incrementally-built props object.
   */
  props: Record<string, unknown>;
  /**
   * Per-key streaming metadata.
   */
  meta: Record<string, KeyMeta>;
  /**
   * True once `markDone` has been called.
   */
  isStreamDone: boolean;
  /**
   * Feed a new token into the hook.
   */
  processToken: (token: StreamToken) => void;
  /**
   * Mark the stream as finished (equivalent to receiving the `done` signal).
   */
  markDone: () => void;
}

/**
 * React hook that incrementally builds a props object from a token stream
 * while tracking per-key streaming state (see Linear issue TAM-153).
 */
export function useStreamProps(
  expectedKeys: string[],
  options: UseStreamPropsOptions = {},
): StreamPropsResult {
  const { onUnknownKey = "ignore" } = options;
  const expectedKeySet = useMemo(() => new Set(expectedKeys), [expectedKeys]);

  // --------------------------------------------------------------------------- //
  // State
  // --------------------------------------------------------------------------- //
  const [props, setProps] = useState<Record<string, unknown>>({});
  const [meta, setMeta] = useState<Record<string, KeyMeta>>(() => {
    const initial: Record<string, KeyMeta> = {};
    expectedKeys.forEach((key) => {
      initial[key] = { state: "notStarted" };
    });
    return initial;
  });
  const [isStreamDone, setIsStreamDone] = useState(false);

  /**
   * Guard to ensure `markDone` / `processToken` become no-ops once completed.
   */
  const isStreamDoneRef = useRef(false);

  /**
   * The key currently receiving tokens (if any).
   */
  const activeKeyRef = useRef<string | null>(null);

  // --------------------------------------------------------------------------- //
  // Token processing
  // --------------------------------------------------------------------------- //
  const processToken = useCallback(
    ({ key, value }: StreamToken) => {
      if (isStreamDoneRef.current) {
        // Stream already finished - ignore further tokens.
        return;
      }

      if (!expectedKeySet.has(key)) {
        if (onUnknownKey === "throw") {
          throw new Error(
            `Received token for unexpected key "${key}" (expected one of: ${[
              ...expectedKeySet,
            ].join(", ")})`,
          );
        }
        // Unknown key in "ignore" mode - drop silently.
        return;
      }

      const now = Date.now();

      setMeta((prev) => {
        const next: Record<string, KeyMeta> = { ...prev };

        // First token for this key – mark start.
        if (next[key].state === "notStarted") {
          next[key] = {
            state: "streaming",
            streamStartedAt: now,
          };
        }

        // If we switched keys, complete the previously active one.
        const prevActive = activeKeyRef.current;
        if (prevActive && prevActive !== key) {
          const prevEntry = next[prevActive];
          if (prevEntry.state === "streaming") {
            next[prevActive] = {
              ...prevEntry,
              state: "complete",
              streamCompletedAt: now,
            };
          }
        }

        activeKeyRef.current = key;
        return next;
      });

      // Append token value.
      setProps((prev) => ({
        ...prev,
        [key]: (prev[key] ?? "") + value,
      }));
    },
    [expectedKeySet, onUnknownKey],
  );

  // --------------------------------------------------------------------------- //
  // Done handler
  // --------------------------------------------------------------------------- //
  const markDone = useCallback(() => {
    if (isStreamDoneRef.current) {
      // Idempotent - ignore if already marked done.
      return;
    }
    isStreamDoneRef.current = true;

    const now = Date.now();

    setMeta((prev) => {
      const next: Record<string, KeyMeta> = {};
      for (const key of Object.keys(prev)) {
        const entry = prev[key];
        if (entry.state === "streaming") {
          next[key] = {
            ...entry,
            state: "complete",
            streamCompletedAt: now,
          };
        } else if (entry.state === "notStarted") {
          next[key] = {
            ...entry,
            state: "skipped",
          };
        } else {
          next[key] = entry;
        }
      }
      return next;
    });

    setIsStreamDone(true);
    activeKeyRef.current = null;
  }, []);

  // --------------------------------------------------------------------------- //
  // Result
  // --------------------------------------------------------------------------- //
  return {
    props,
    meta,
    isStreamDone,
    processToken,
    markDone,
  };
}
