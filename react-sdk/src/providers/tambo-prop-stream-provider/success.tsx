import React from "react";
import { useTamboStream } from "./provider";
import { DEFAULT_STREAM_KEY, StreamStateComponentProps } from "./types";

/**
 * Success component that renders children when the stream has data
 * @param props - The props for the Success component
 * @param props.streamKey - The key to identify this success state
 * @param props.children - The children to render when success
 * @param props.className - Optional className for styling
 * @returns The Success component
 */
export const Success: React.FC<StreamStateComponentProps> = ({
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
      data-stream-state="success"
    >
      {children}
    </div>
  );
};

Success.displayName = "TamboPropStreamProvider.Success";
