import { watch } from "vue";

export function useTamboStreamingProps<T extends Record<string, any>>(
  currentState: T | undefined,
  setState: (state: T) => void,
  streamingProps: Partial<T>,
) {
  watch(
    () => ({ ...streamingProps }),
    (newProps) => {
      if (currentState) {
        let shouldUpdate = false;
        const updates: Partial<T> = {};
        Object.entries(newProps).forEach(([key, value]) => {
          if (value !== undefined && value !== (currentState as any)[key]) {
            shouldUpdate = true;
            (updates as any)[key] = value;
          }
        });
        if (shouldUpdate) setState({ ...currentState, ...updates });
      }
    },
    { deep: true },
  );
}

