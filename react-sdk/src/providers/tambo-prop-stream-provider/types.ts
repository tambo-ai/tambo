import React from "react";
import { StreamStatus as HookStreamStatus } from "../../hooks/use-tambo-stream-status";

// Constants
export const DEFAULT_STREAM_KEY = "default";

export interface StreamStateComponentProps {
  /** The key to identify this stream state */
  streamKey?: string;
  /** The children to render */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
}

export interface StreamStatus {
  isPending: boolean;
  isStreaming: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: Error;
}

export interface TamboPropStreamContextValue {
  /** The stream status */
  streamStatus: HookStreamStatus;
  /** Get the status for a specific key */
  getStatusForKey: (key: string) => StreamStatus;
}
