"use client";

import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useTamboStreamStatus } from "../../hooks/use-tambo-stream-status";
import {
  DEFAULT_STREAM_KEY,
  StreamStatus,
  TamboPropStreamContextValue,
} from "./types";

const TamboPropStreamContext =
  createContext<TamboPropStreamContextValue | null>(null);

/**
 * Hook to use the TamboStream context
 * @returns The TamboStream context
 */
export const useTamboStream = (): TamboPropStreamContextValue => {
  const context = useContext(TamboPropStreamContext);
  if (!context) {
    throw new Error(
      "useTamboStream must be used within a TamboPropStreamProvider",
    );
  }
  return context;
};

/**
 * The TamboStreamProvider provides a context for managing stream states
 * with compound components for Pending, Streaming, and Success states.
 * @param props - The props object
 * @param props.children - The children to wrap
 * @returns The TamboStreamProvider component
 */
const TamboPropStreamProviderComponent: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { propStatus, streamStatus } = useTamboStreamStatus();

  const keyStatusMap = useMemo(() => {
    const map = new Map<string, StreamStatus>();

    if (propStatus) {
      Object.entries(propStatus).forEach(([key, status]) => {
        map.set(key, {
          isPending: status.isPending,
          isStreaming: status.isStreaming,
          isSuccess: status.isSuccess,
          isError: !!status.error,
          error: status.error,
        });
      });
    }

    // Always set default status for fallback
    map.set(DEFAULT_STREAM_KEY, {
      isPending: streamStatus.isPending,
      isStreaming: streamStatus.isStreaming,
      isSuccess: streamStatus.isSuccess,
      isError: streamStatus.isError,
      error: streamStatus.streamError,
    });

    return map;
  }, [streamStatus, propStatus]);

  const getStatusForKey = useCallback(
    (key: string): StreamStatus => {
      // If the key exists in propStatus, return its status
      const propStatus = keyStatusMap.get(key);
      if (propStatus) {
        return propStatus;
      }

      // If key doesn't exist in propStatus, assume it's pending
      return {
        isPending: true,
        isStreaming: false,
        isSuccess: false,
        isError: false,
      };
    },
    [keyStatusMap],
  );

  const contextValue = useMemo(
    (): TamboPropStreamContextValue => ({
      streamStatus,
      getStatusForKey,
    }),
    [streamStatus, getStatusForKey],
  );

  return (
    <TamboPropStreamContext.Provider value={contextValue}>
      {children}
    </TamboPropStreamContext.Provider>
  );
};

export { TamboPropStreamProviderComponent };
