export const DEFAULT_STREAM_KEY = "default";

export interface StreamStatus {
  isPending: boolean;
  isStreaming: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: Error;
}

export interface TamboPropStreamContextValue {
  streamStatus: import("../../composables/use-tambo-stream-status").StreamStatus;
  getStatusForKey: (key: string) => StreamStatus;
}

