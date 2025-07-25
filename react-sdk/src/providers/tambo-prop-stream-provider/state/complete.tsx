import React from "react";
import { useTamboStream } from "../provider";
import { DEFAULT_STREAM_KEY, StreamStateComponentProps } from "../types";

/**
 * Complete component that renders children when the stream has data
 * @param props - The props for the Complete component
 * @param props.streamKey - The key to identify this complete state
 * @param props.children - The children to render when complete
 * @param props.className - Optional className for styling
 * @returns The Complete component
 */
export const Complete: React.FC<StreamStateComponentProps> = ({
  streamKey = DEFAULT_STREAM_KEY,
  children,
  className,
}) => {
  const { getStatusForKey } = useTamboStream();
  const status = getStatusForKey(streamKey);

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
