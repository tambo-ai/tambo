import { defineComponent, h, inject, provide } from "vue";
import { useTamboStreamStatus } from "../../composables/use-tambo-stream-status";
import { DEFAULT_STREAM_KEY, type StreamStatus, type TamboPropStreamContextValue } from "./types";

const TAMBO_PROP_STREAM_CTX = Symbol("TAMBO_PROP_STREAM_CTX") as import("vue").InjectionKey<TamboPropStreamContextValue>;

export const useTamboStream = (): TamboPropStreamContextValue => {
  const ctx = inject(TAMBO_PROP_STREAM_CTX);
  if (!ctx) throw new Error("useTamboStream must be used within a TamboPropStreamProvider");
  return ctx;
};

export const TamboPropStreamProviderComponent = defineComponent({
  name: "TamboPropStreamProvider",
  setup(_props, { slots }) {
    const { propStatus, streamStatus } = useTamboStreamStatus();
    const keyStatusMap = new Map<string, StreamStatus>();
    if (propStatus) {
      Object.entries(propStatus as any).forEach(([key, status]) => {
        keyStatusMap.set(key, {
          isPending: (status as any).isPending,
          isStreaming: (status as any).isStreaming,
          isSuccess: (status as any).isSuccess,
          isError: !!(status as any).error,
          error: (status as any).error,
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
    const value: TamboPropStreamContextValue = { streamStatus, getStatusForKey } as any;
    provide(TAMBO_PROP_STREAM_CTX, value);
    return () => (slots.default ? slots.default() : h("div"));
  },
});

