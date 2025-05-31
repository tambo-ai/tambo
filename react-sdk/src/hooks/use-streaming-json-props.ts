import { useCallback, useRef, useState } from "react";

export type KeyState = "notStarted" | "streaming" | "complete" | "skipped";

export interface KeyMeta {
  state: KeyState;
  streamStartedAt?: number;
  streamCompletedAt?: number;
}

export interface StreamChunk {
  key: string;
  value: string;
}

export interface UseStreamingPropsResult<T extends Record<string, any>> {
  props: Partial<T>;
  meta: Record<keyof T | string, KeyMeta>;
  isStreamDone: boolean;
  handleChunk: (chunk: StreamChunk) => void;
  handleDone: () => void;
}

/**
 * Hook to track a JSON streaming response on a per-key basis.
 * @param expectedKeys - list of keys expected in the final props object
 * @returns current props, metadata for each key, and helper functions
 */
export function useStreamingProps<T extends Record<string, any>>(
  expectedKeys: (keyof T | string)[],
): UseStreamingPropsResult<T> {
  const [props, setProps] = useState<Partial<T>>({});
  const [meta, setMeta] = useState<Record<string, KeyMeta>>(() => {
    const initial: Record<string, KeyMeta> = {};
    for (const key of expectedKeys) {
      initial[String(key)] = { state: "notStarted" };
    }
    return initial;
  });
  const [isStreamDone, setIsStreamDone] = useState(false);

  const currentKeyRef = useRef<string | null>(null);

  const handleChunk = useCallback(
    ({ key, value }: StreamChunk) => {
      if (!expectedKeys.includes(key)) {
        // Ignore unknown keys
        return;
      }

      setProps((prev) => ({
        ...prev,
        [key]: ((prev as Record<string, string>)[key] || "") + value,
      }));

      setMeta((prev) => {
        const now = Date.now();
        const updated = { ...prev };
        const prevCurrent = currentKeyRef.current;

        if (prevCurrent && prevCurrent !== key) {
          const prevMeta = updated[prevCurrent];
          if (prevMeta && prevMeta.state === "streaming") {
            updated[prevCurrent] = {
              ...prevMeta,
              state: "complete",
              streamCompletedAt: now,
            };
          }
        }

        const thisMeta = updated[key];
        if (thisMeta.state === "notStarted") {
          updated[key] = { state: "streaming", streamStartedAt: now };
        } else if (thisMeta.state === "complete") {
          updated[key] = {
            ...thisMeta,
            state: "streaming",
            streamCompletedAt: undefined,
          };
        }

        currentKeyRef.current = key;
        return updated;
      });
    },
    [expectedKeys],
  );

  const handleDone = useCallback(() => {
    setMeta((prev) => {
      const now = Date.now();
      const updated: Record<string, KeyMeta> = { ...prev };

      for (const key of expectedKeys.map(String)) {
        const info = updated[key];
        if (!info) continue;
        if (info.state === "streaming") {
          updated[key] = {
            ...info,
            state: "complete",
            streamCompletedAt: now,
          };
        } else if (info.state === "notStarted") {
          updated[key] = { state: "skipped" };
        }
      }

      return updated;
    });
    setIsStreamDone(true);
    currentKeyRef.current = null;
  }, [expectedKeys]);

  return {
    props,
    meta: meta as Record<keyof T | string, KeyMeta>,
    isStreamDone,
    handleChunk,
    handleDone,
  };
}

export default useStreamingProps;
