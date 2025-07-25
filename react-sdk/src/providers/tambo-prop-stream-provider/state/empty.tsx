import React from "react";
import { useTamboStream } from "../provider";
import { DEFAULT_STREAM_KEY, StreamStateComponentProps } from "../types";

/**
 * Empty component that renders children when the stream has no data
 * @param props - The props for the Empty component
 * @param props.streamKey - The key to identify this empty state
 * @param props.children - The children to render when empty
 * @param props.className - Optional className for styling
 * @returns The Empty component
 */
export const Empty: React.FC<StreamStateComponentProps> = ({
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
