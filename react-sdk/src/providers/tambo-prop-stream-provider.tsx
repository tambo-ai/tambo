"use client";

import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useCallback,
} from "react";
import {
  StreamStatus,
  PropStatus,
  useTamboStreamStatus,
} from "../hooks/use-tambo-stream-status";

interface TamboPropStreamContextValue {
  /** The stream data */
  data: any;
  /** The stream status */
  streamStatus: StreamStatus;
  /** Get the status for a specific key */
  getStatusForKey: (key: string) => {
    isPending: boolean;
    isStreaming: boolean;
    isSuccess: boolean;
    isError: boolean;
    error?: Error;
  };
}

const TamboPropStreamContext =
  createContext<TamboPropStreamContextValue | null>(null);

export interface TamboPropStreamProviderProps {
  /** The stream data */
  data: any;
  /** Optional stream status for more granular control */
  streamStatus?: StreamStatus;
  /** Optional per-prop status for fine-grained control */
  propStatus?: Record<string, PropStatus>;
}

export interface LoadingProps {
  /** The key to identify this loading state */
  streamKey?: string;
  /** The children to render when loading */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
}

export interface EmptyProps {
  /** The key to identify this empty state */
  streamKey?: string;
  /** The children to render when empty */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
}

export interface CompleteProps {
  /** The key to identify this complete state */
  streamKey?: string;
  /** The children to render when complete */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
}

/**
 * Loading component that renders children when the stream is in a loading state
 * @param props - The props for the Loading component
 * @param props.streamKey - The key to identify this loading state
 * @param props.children - The children to render when loading
 * @param props.className - Optional className for styling
 * @returns The Loading component
 */
const Loading: React.FC<LoadingProps> = ({
  streamKey = "default",
  children,
  className,
}) => {
  const { getStatusForKey } = useTamboStream();
  const status = getStatusForKey(streamKey);

  if (!status.isPending && !status.isStreaming) {
    return null;
  }

  return (
    <div
      className={className}
      data-stream-key={streamKey}
      data-stream-state="loading"
    >
      {children}
    </div>
  );
};

/**
 * Empty component that renders children when the stream has no data
 * @param props - The props for the Empty component
 * @param props.streamKey - The key to identify this empty state
 * @param props.children - The children to render when empty
 * @param props.className - Optional className for styling
 * @returns The Empty component
 */
const Empty: React.FC<EmptyProps> = ({
  streamKey = "default",
  children,
  className,
}) => {
  const { data, getStatusForKey } = useTamboStream();
  const status = getStatusForKey(streamKey);

  // Get the specific data for this key
  const keyData =
    data && typeof data === "object" && !Array.isArray(data)
      ? data[streamKey]
      : data;

  // Show empty state only when:
  // 1. Not in any active state (not pending, streaming, success, or error)
  // 2. AND the data is actually empty
  // This prevents showing empty state during streaming or after completion
  const shouldShowEmpty =
    !status.isPending &&
    !status.isStreaming &&
    !status.isSuccess &&
    !status.isError &&
    (keyData === undefined || keyData === null || keyData === "");

  if (!shouldShowEmpty) {
    return null;
  }

  return (
    <div
      className={className}
      data-stream-key={streamKey}
      data-stream-state="empty"
    >
      {children}
    </div>
  );
};

/**
 * Complete component that renders children when the stream has data
 * @param props - The props for the Complete component
 * @param props.streamKey - The key to identify this complete state
 * @param props.children - The children to render when complete
 * @param props.className - Optional className for styling
 * @returns The Complete component
 */
const Complete: React.FC<CompleteProps> = ({
  streamKey = "default",
  children,
  className,
}) => {
  const { getStatusForKey } = useTamboStream();
  const status = getStatusForKey(streamKey);

  // Simple: Show when status is success, regardless of data value
  if (!status.isSuccess) {
    return null;
  }

  return (
    <div
      className={className}
      data-stream-key={streamKey}
      data-stream-state="complete"
    >
      {children}
    </div>
  );
};

/**
 * Hook to use the TamboStream context
 * @returns The TamboStream context
 */
export const useTamboStream = () => {
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
 * with compound components for Loading, Empty, and Complete states.
 * @param props - The props for the TamboStreamProvider
 * @param props.children - The children to wrap
 * @param props.data - The stream data
 * @param props.streamStatus - Optional stream status for more granular control
 * @param props.propStatus - Optional per-prop status for fine-grained control
 * @returns The TamboStreamProvider component
 */
const TamboPropStreamProviderComponent: React.FC<
  PropsWithChildren<TamboPropStreamProviderProps>
> = ({
  children,
  data,
  streamStatus: providedStreamStatus,
  propStatus: providedPropStatus,
}) => {
  // Always try to call the hook - React hooks must be called unconditionally
  let hookStreamStatus: StreamStatus | undefined;
  let hookPropStatus: Record<string, PropStatus> | undefined;

  try {
    const hookResult = useTamboStreamStatus();
    hookStreamStatus = hookResult.streamStatus;
    hookPropStatus = hookResult.propStatus;
  } catch {
    // Hook failed (not in Tambo context), that's ok
  }

  // Use provided status, then hook status, then defaults
  const finalStreamStatus = useMemo(
    () =>
      providedStreamStatus ??
      hookStreamStatus ?? {
        isPending: false,
        isStreaming: false,
        isSuccess: true,
        isError: false,
        streamError: undefined,
      },
    [providedStreamStatus, hookStreamStatus],
  );

  const finalPropStatus = useMemo(
    () => providedPropStatus ?? hookPropStatus,
    [providedPropStatus, hookPropStatus],
  );

  // Track status by key for compound components
  const keyStatusMap = useMemo(() => {
    const map = new Map<
      string,
      {
        isPending: boolean;
        isStreaming: boolean;
        isSuccess: boolean;
        isError: boolean;
        error?: Error;
      }
    >();

    // If propStatus is available (from hook), use it for per-prop granularity
    if (finalPropStatus) {
      Object.entries(finalPropStatus).forEach(([key, status]) => {
        map.set(key, {
          isPending: status.isPending,
          isStreaming: status.isStreaming,
          isSuccess: status.isSuccess,
          isError: !!status.error,
          error: status.error,
        });
      });
    } else {
      // Fall back to original behavior: all keys get the same status
      if (data && typeof data === "object" && !Array.isArray(data)) {
        Object.keys(data).forEach((key) => {
          map.set(key, {
            isPending: finalStreamStatus.isPending,
            isStreaming: finalStreamStatus.isStreaming,
            isSuccess: finalStreamStatus.isSuccess,
            isError: finalStreamStatus.isError,
            error: finalStreamStatus.streamError,
          });
        });
      }
    }

    // Always set default status for fallback
    map.set("default", {
      isPending: finalStreamStatus.isPending,
      isStreaming: finalStreamStatus.isStreaming,
      isSuccess: finalStreamStatus.isSuccess,
      isError: finalStreamStatus.isError,
      error: finalStreamStatus.streamError,
    });

    return map;
  }, [finalStreamStatus, data, finalPropStatus]);

  const getStatusForKey = useCallback(
    (key: string) => {
      return (
        keyStatusMap.get(key) ??
        keyStatusMap.get("default") ?? {
          isPending: false,
          isStreaming: false,
          isSuccess: false,
          isError: false,
        }
      );
    },
    [keyStatusMap],
  );

  const contextValue = useMemo(
    () => ({
      data,
      streamStatus: finalStreamStatus,
      getStatusForKey,
    }),
    [data, finalStreamStatus, getStatusForKey],
  );

  return (
    <TamboPropStreamContext.Provider value={contextValue}>
      {children}
    </TamboPropStreamContext.Provider>
  );
};

// Create the compound component type
type TamboPropStreamProviderCompound =
  typeof TamboPropStreamProviderComponent & {
    Loading: typeof Loading;
    Empty: typeof Empty;
    Complete: typeof Complete;
  };

export const TamboPropStreamProvider =
  TamboPropStreamProviderComponent as TamboPropStreamProviderCompound;

TamboPropStreamProvider.Loading = Loading;
TamboPropStreamProvider.Empty = Empty;
TamboPropStreamProvider.Complete = Complete;
