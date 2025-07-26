import React from "react";
import { useTamboStream } from "../provider";
import { DEFAULT_STREAM_KEY, StreamStateComponentProps } from "../types";

/**
 * Loading component that renders children when the stream is in a loading state
 * @param props - The props for the Loading component
 * @param props.streamKey - The key to identify this loading state
 * @param props.children - The children to render when loading
 * @param props.className - Optional className for styling
 * @returns The Loading component
 */
export const Loading: React.FC<StreamStateComponentProps> = ({
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
