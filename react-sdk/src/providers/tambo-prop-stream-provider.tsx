"use client";

import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  PropStatus,
  StreamStatus,
  useTamboStreamStatus,
} from "../hooks/use-tambo-stream-status";

// Constants
const DEFAULT_STREAM_KEY = "default";

interface TamboPropStreamContextValue {
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
  streamKey = DEFAULT_STREAM_KEY,
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

Loading.displayName = "TamboPropStreamProvider.Loading";

/**
 * Empty component that renders children when the stream has no data
 * @param props - The props for the Empty component
 * @param props.streamKey - The key to identify this empty state
 * @param props.children - The children to render when empty
 * @param props.className - Optional className for styling
 * @returns The Empty component
 */
const Empty: React.FC<EmptyProps> = ({
  streamKey = DEFAULT_STREAM_KEY,
  children,
  className,
}) => {
  const { getStatusForKey } = useTamboStream();
  const status = getStatusForKey(streamKey);

  // Show empty state when no active status (prop doesn't exist or is pending)
  const hasActiveStatus =
    status.isPending ||
    status.isStreaming ||
    status.isSuccess ||
    status.isError;
  const shouldShowEmpty = !hasActiveStatus;

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

Empty.displayName = "TamboPropStreamProvider.Empty";

/**
 * Complete component that renders children when the stream has data
 * @param props - The props for the Complete component
 * @param props.streamKey - The key to identify this complete state
 * @param props.children - The children to render when complete
 * @param props.className - Optional className for styling
 * @returns The Complete component
 */
const Complete: React.FC<CompleteProps> = ({
  streamKey = DEFAULT_STREAM_KEY,
  children,
  className,
}) => {
  const { getStatusForKey } = useTamboStream();
  const status = getStatusForKey(streamKey);

  // Simple: Show when status is success
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

Complete.displayName = "TamboPropStreamProvider.Complete";

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
 * with compound components for Loading, Empty, and Complete states.
 * @param props - The props for the TamboStreamProvider
 * @param props.children - The children to wrap
 * @param props.streamStatus - Optional stream status for more granular control
 * @param props.propStatus - Optional per-prop status for fine-grained control
 * @returns The TamboStreamProvider component
 */
const TamboPropStreamProviderComponent = ({
  children,
  streamStatus: providedStreamStatus,
  propStatus: providedPropStatus,
}: PropsWithChildren<TamboPropStreamProviderProps>) => {
  const { propStatus, streamStatus } = useTamboStreamStatus();

  // Use provided status, then hook status, then defaults
  const finalStreamStatus = useMemo(
    () =>
      providedStreamStatus ??
      streamStatus ?? {
        isPending: false,
        isStreaming: false,
        isSuccess: true,
        isError: false,
        streamError: undefined,
      },
    [providedStreamStatus, streamStatus],
  );

  const finalPropStatus = useMemo(
    () => providedPropStatus ?? propStatus,
    [providedPropStatus, propStatus],
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

    // If propStatus is available, use it for per-prop granularity
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
    }

    // Always set default status for fallback
    map.set(DEFAULT_STREAM_KEY, {
      isPending: finalStreamStatus.isPending,
      isStreaming: finalStreamStatus.isStreaming,
      isSuccess: finalStreamStatus.isSuccess,
      isError: finalStreamStatus.isError,
      error: finalStreamStatus.streamError,
    });

    return map;
  }, [finalStreamStatus, finalPropStatus]);

  const getStatusForKey = useCallback(
    (key: string) => {
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
    () => ({
      streamStatus: finalStreamStatus,
      getStatusForKey,
    }),
    [finalStreamStatus, getStatusForKey],
  );

  return (
    <TamboPropStreamContext.Provider value={contextValue}>
      {children}
    </TamboPropStreamContext.Provider>
  );
};

// Create the compound component
export const TamboPropStreamProvider = Object.assign(
  TamboPropStreamProviderComponent,
  {
    Loading,
    Empty,
    Complete,
  },
);
