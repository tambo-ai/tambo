"use client";

/**
 * Hook for consuming devtools events from the event bus.
 *
 * Subscribes to the `devtoolsEventBus` singleton and accumulates
 * events in a ring buffer. Returns the current snapshot of events
 * and a function to clear them.
 */

import { useCallback, useRef, useSyncExternalStore } from "react";
import { devtoolsEventBus, type DevtoolsEvent } from "@tambo-ai/client";

const MAX_EVENTS = 500;

interface DevtoolsEventsStore {
  events: DevtoolsEvent[];
  version: number;
}

interface DevtoolsEventsReturn {
  /** Current snapshot of captured devtools events. */
  events: readonly DevtoolsEvent[];
  /** Clear all captured events. */
  clearEvents: () => void;
}

/**
 * React hook that subscribes to the devtools event bus and accumulates events.
 *
 * Uses `useSyncExternalStore` to efficiently bridge the event bus singleton
 * with React's rendering cycle. Caps at {@link MAX_EVENTS} events
 * (oldest are dropped when full).
 * @returns Events snapshot and clear function
 */
export function useTamboDevtoolsEvents(): DevtoolsEventsReturn {
  const storeRef = useRef<DevtoolsEventsStore>({
    events: [],
    version: 0,
  });

  const listenersRef = useRef(new Set<() => void>());

  const notifyReact = useCallback(() => {
    for (const listener of listenersRef.current) {
      listener();
    }
  }, []);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      listenersRef.current.add(onStoreChange);

      const unsubscribe = devtoolsEventBus.subscribe((event) => {
        const store = storeRef.current;
        const nextEvents =
          store.events.length >= MAX_EVENTS
            ? [...store.events.slice(1), event]
            : [...store.events, event];

        storeRef.current = {
          events: nextEvents,
          version: store.version + 1,
        };
        notifyReact();
      });

      return () => {
        listenersRef.current.delete(onStoreChange);
        unsubscribe();
      };
    },
    [notifyReact],
  );

  const getSnapshot = useCallback(() => storeRef.current, []);
  const getServerSnapshot = useCallback(
    (): DevtoolsEventsStore => ({ events: [], version: 0 }),
    [],
  );

  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const clearEvents = useCallback(() => {
    storeRef.current = { events: [], version: storeRef.current.version + 1 };
    notifyReact();
  }, [notifyReact]);

  return {
    events: store.events,
    clearEvents,
  };
}
