import type { StreamStatus as HookStreamStatus } from "../../hooks/use-tambo-stream-status";

export const DEFAULT_STREAM_KEY = "default";

export interface StreamStateComponentProps {
  streamKey?: string;
  children?: any;
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
  streamStatus: HookStreamStatus;
  getStatusForKey: (key: string) => StreamStatus;
}

