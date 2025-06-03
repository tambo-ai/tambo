import { useCallback, useMemo, useRef, useState } from "react";

export type KeyState = "notStarted" | "streaming" | "complete" | "skipped";

export interface KeyMeta {
  state: KeyState;
  streamStartedAt?: number;
  streamCompletedAt?: number;
}

export interface StreamingStateResult<T = Record<string, any>> {
  props: T;
  meta: Record<string, KeyMeta>;
  isStreamDone: boolean;
}

export interface StreamInput {
  key: string;
  value: string;
}

/**
 * Hook for managing streaming state of props with per-key state tracking.
 * Tracks streaming, completion, and skipping states for each expected key.
 * @returns Object with result, processToken, markDone, and reset functions
 */
export function useStreamingState<
  T extends Record<string, any> = Record<string, any>,
>(
  expectedKeys: (keyof T)[],
  options?: {
    ignoreUnknownKeys?: boolean;
  },
): {
  result: StreamingStateResult<Partial<T>>;
  processToken: (input: StreamInput) => void;
  markDone: () => void;
  reset: () => void;
} {
  const { ignoreUnknownKeys = true } = options ?? {};

  const [props, setProps] = useState<Partial<T>>({});
  const [isStreamDone, setIsStreamDone] = useState(false);
  const currentStreamingKey = useRef<string | null>(null);

  const [meta, setMeta] = useState<Record<string, KeyMeta>>(() => {
    const initialMeta: Record<string, KeyMeta> = {};
    expectedKeys.forEach((key) => {
      initialMeta[key as string] = { state: "notStarted" };
    });
    return initialMeta;
  });

  const processToken = useCallback(
    (input: StreamInput) => {
      const { key, value } = input;

      if (!ignoreUnknownKeys && !expectedKeys.includes(key as keyof T)) {
        throw new Error(`Unknown key: ${key}`);
      }

      if (ignoreUnknownKeys && !expectedKeys.includes(key as keyof T)) {
        return;
      }

      const now = Date.now();
      const prevStreamingKey = currentStreamingKey.current;

      // Update the current streaming key immediately
      currentStreamingKey.current = key;

      setMeta((prevMeta) => {
        const newMeta = { ...prevMeta };

        // Mark previous streaming key as complete when switching to a new key
        if (prevStreamingKey && prevStreamingKey !== key) {
          newMeta[prevStreamingKey] = {
            ...newMeta[prevStreamingKey],
            state: "complete",
            streamCompletedAt: now,
          };
        }

        // Mark current key as streaming if it's the first time we see it
        if (newMeta[key]?.state === "notStarted") {
          newMeta[key] = {
            ...newMeta[key],
            state: "streaming",
            streamStartedAt: now,
          };
        }

        return newMeta;
      });

      setProps((prevProps) => ({
        ...prevProps,
        [key]: value,
      }));
    },
    [expectedKeys, ignoreUnknownKeys],
  );

  const markDone = useCallback(() => {
    const now = Date.now();

    setMeta((prevMeta) => {
      const newMeta = { ...prevMeta };

      expectedKeys.forEach((key) => {
        const keyStr = key as string;
        if (newMeta[keyStr]?.state === "streaming") {
          newMeta[keyStr] = {
            ...newMeta[keyStr],
            state: "complete",
            streamCompletedAt: now,
          };
        } else if (newMeta[keyStr]?.state === "notStarted") {
          newMeta[keyStr] = {
            ...newMeta[keyStr],
            state: "skipped",
          };
        }
      });

      return newMeta;
    });

    currentStreamingKey.current = null;
    setIsStreamDone(true);
  }, [expectedKeys]);

  const reset = useCallback(() => {
    setProps({});
    setIsStreamDone(false);
    currentStreamingKey.current = null;

    const initialMeta: Record<string, KeyMeta> = {};
    expectedKeys.forEach((key) => {
      initialMeta[key as string] = { state: "notStarted" };
    });
    setMeta(initialMeta);
  }, [expectedKeys]);

  const result = useMemo<StreamingStateResult<Partial<T>>>(
    () => ({
      props,
      meta,
      isStreamDone,
    }),
    [props, meta, isStreamDone],
  );

  return {
    result,
    processToken,
    markDone,
    reset,
  };
}
