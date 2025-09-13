import { InjectionKey, inject, provide } from "vue";
import { useTamboStreamStatus } from "../../hooks/use-tambo-stream-status";
import { DEFAULT_STREAM_KEY, StreamStatus, TamboPropStreamContextValue } from "./types";

const TamboPropStreamKey: InjectionKey<TamboPropStreamContextValue> = Symbol("TamboPropStreamContext");

export function useTamboStream(): TamboPropStreamContextValue {
  const ctx = inject(TamboPropStreamKey);
  if (!ctx) throw new Error("useTamboStream must be used within a TamboPropStreamProvider");
  return ctx;
}

export function provideTamboPropStream() {
  const { propStatus, streamStatus } = useTamboStreamStatus();
  const keyStatusMap = new Map<string, StreamStatus>();
  if (propStatus) {
    Object.entries(propStatus as any).forEach(([key, status]: any) => {
      keyStatusMap.set(key, {
        isPending: status.isPending,
        isStreaming: status.isStreaming,
        isSuccess: status.isSuccess,
        isError: !!status.error,
        error: status.error,
      });
    });
  }
  keyStatusMap.set(DEFAULT_STREAM_KEY, {
    isPending: streamStatus.isPending,
    isStreaming: streamStatus.isStreaming,
    isSuccess: streamStatus.isSuccess,
    isError: streamStatus.isError,
    error: streamStatus.streamError,
  });
  const getStatusForKey = (key: string): StreamStatus => {
    const s = keyStatusMap.get(key);
    if (s) return s;
    return { isPending: true, isStreaming: false, isSuccess: false, isError: false };
  };
  const ctx: TamboPropStreamContextValue = { streamStatus, getStatusForKey } as any;
  provide(TamboPropStreamKey, ctx);
  return ctx;
}

