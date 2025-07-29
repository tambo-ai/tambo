import React from "react";
import { useTamboStream } from "./provider";
import { DEFAULT_STREAM_KEY, StreamStateComponentProps } from "./types";

/**
 * Pending component that renders children when the stream has no data
 * @param props - The props for the Pending component
 * @param props.streamKey - The key to identify this pending state
 * @param props.children - The children to render when pending
 * @param props.className - Optional className for styling
 * @returns The Pending component
 */
export const Pending: React.FC<StreamStateComponentProps> = ({
  streamKey = DEFAULT_STREAM_KEY,
  children,
  className,
}) => {
  const { getStatusForKey } = useTamboStream();
  const status = getStatusForKey(streamKey);

  // Show pending state when no active status (prop doesn't exist or is pending)
  const hasActiveStatus =
    status.isStreaming || status.isSuccess || status.isError;
  const shouldShowPending = !hasActiveStatus;

  if (!shouldShowPending) {
    return null;
  }

  return (
    <div
      className={className}
      data-stream-key={streamKey}
      data-stream-state="pending"
    >
      {children}
    </div>
  );
};

Pending.displayName = "TamboPropStreamProvider.Pending";
