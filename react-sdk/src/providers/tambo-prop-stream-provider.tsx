"use client";

import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import { StreamStatus } from "../hooks/use-tambo-stream-status";

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

  // Show empty state when not loading, not streaming, not successful, and no data for this key
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
  const { data, getStatusForKey } = useTamboStream();
  const status = getStatusForKey(streamKey);

  // Get the specific data for this key
  const keyData =
    data && typeof data === "object" && !Array.isArray(data)
      ? data[streamKey]
      : data;

  // Show complete when we have data for this key and the stream is successful
  const shouldShowComplete =
    status.isSuccess && keyData !== undefined && keyData !== null;

  if (!shouldShowComplete) {
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
 * @returns The TamboStreamProvider component
 */
const TamboPropStreamProviderComponent: React.FC<
  PropsWithChildren<TamboPropStreamProviderProps>
> = ({ children, data, streamStatus }) => {
  // Create a default stream status if none provided
  const defaultStreamStatus: StreamStatus = useMemo(
    () => ({
      isPending: false, // No external stream, so not pending
      isStreaming: false, // No external stream, so not streaming
      isSuccess: true, // If no stream status provided, assume success
      isError: false,
      streamError: undefined,
    }),
    [],
  );

  const finalStreamStatus = streamStatus ?? defaultStreamStatus;

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

    // Track per-key status based on data structure
    // If data is an object with keys, create status for each key
    if (data && typeof data === "object" && !Array.isArray(data)) {
      Object.keys(data).forEach((key) => {
        const keyData = data[key];
        const hasData =
          keyData !== undefined && keyData !== null && keyData !== "";

        map.set(key, {
          // If no external stream, show loading when key has no data
          isPending:
            finalStreamStatus.isPending ||
            (!finalStreamStatus.isStreaming && !hasData),
          isStreaming: finalStreamStatus.isStreaming && !hasData,
          isSuccess: finalStreamStatus.isSuccess && hasData,
          isError: finalStreamStatus.isError,
          error: finalStreamStatus.streamError,
        });
      });
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
  }, [finalStreamStatus, data]);

  const getStatusForKey = useMemo(
    () => (key: string) => {
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
