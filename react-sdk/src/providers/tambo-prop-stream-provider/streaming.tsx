import React from "react";
import { useTamboStream } from "./provider";
import { DEFAULT_STREAM_KEY, StreamStateComponentProps } from "./types";

/**
 * Streaming component that renders children when the stream is in a streaming state
 * @param props - The props for the Streaming component
 * @param props.streamKey - The key to identify this streaming state
 * @param props.children - The children to render when streaming
 * @param props.className - Optional className for styling
 * @returns The Streaming component
 */
export const Streaming: React.FC<StreamStateComponentProps> = ({
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
      data-stream-state="streaming"
    >
      {children}
    </div>
  );
};

Streaming.displayName = "TamboPropStreamProvider.Streaming";
