"use client";

import { useContext, useEffect, useRef } from "react";

import { TamboClientContext } from "../providers/tambo-client-provider";
import { TamboRegistryContext } from "../providers/tambo-registry-provider";
import type { StreamState } from "../v1/utils/event-accumulator";
import { DevToolsBridge } from "./devtools-bridge";
import type { DevToolsStateSnapshot } from "./devtools-protocol";
import { serializeForDevtools } from "./serialize-snapshot";
import { useStreamStateForDevtools } from "./use-stream-state-for-devtools";

/**
 * SDK version string sent in the devtools handshake.
 * TODO: Automate injection from package.json during the release process.
 */
const SDK_VERSION = "1.0.1";

/** Debounce interval for snapshot emission (milliseconds). */
const SNAPSHOT_DEBOUNCE_MS = 250;

/**
 * Props for the TamboDevTools component.
 */
export interface TamboDevToolsProps {
  /** Port of the devtools WebSocket server. Defaults to 8265. */
  port?: number;
  /** Host of the devtools WebSocket server. Defaults to "localhost". */
  host?: string;
}

/** Default empty stream state when not inside TamboStreamProvider. */
const EMPTY_STREAM_STATE: StreamState = {
  threadMap: {},
  currentThreadId: "placeholder",
};

/**
 * Opt-in devtools bridge component.
 *
 * Place inside `<TamboProvider>` to enable a WebSocket connection to the
 * Tambo DevTools server. This component renders nothing visible. It
 * establishes a connection on mount, sends a handshake with SDK metadata,
 * and disconnects cleanly on unmount. When placed within a TamboStreamProvider,
 * it automatically extracts state from React contexts and sends debounced
 * enriched snapshots to the devtools dashboard.
 *
 * The devtools code is completely isolated behind the `@tambo-ai/react/devtools`
 * subpath export and has zero bundle cost when not imported.
 * @param props - Optional host and port overrides
 * @returns null (renders nothing)
 * @example
 * ```tsx
 * import { TamboProvider } from "@tambo-ai/react";
 * import { TamboDevTools } from "@tambo-ai/react/devtools";
 *
 * function App() {
 *   return (
 *     <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}>
 *       <MyApp />
 *       <TamboDevTools />
 *     </TamboProvider>
 *   );
 * }
 * ```
 */
export function TamboDevTools({ port, host }: TamboDevToolsProps): null {
  // Read projectId from TamboProvider context if available.
  // Uses useContext directly (not the throwing useTamboClient hook) so
  // the component degrades gracefully outside of TamboProvider.
  const clientContext = useContext(TamboClientContext);
  const projectId = clientContext?.client.apiKey ?? undefined;

  // Read registry context (degrades gracefully with defaults)
  const registry = useContext(TamboRegistryContext);

  // Read stream state context if available (returns null outside TamboStreamProvider)
  const streamState = useStreamStateForDevtools();

  // Stable session ID across re-renders
  const sessionIdRef = useRef(crypto.randomUUID());

  // Bridge persisted across renders
  const bridgeRef = useRef<DevToolsBridge | null>(null);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest values in refs so the sendSnapshot closure is always current
  const streamStateRef = useRef(streamState);
  streamStateRef.current = streamState;
  const registryRef = useRef(registry);
  registryRef.current = registry;

  // Create bridge on mount, clean up on unmount
  useEffect(() => {
    const sendSnapshot = (): void => {
      const bridge = bridgeRef.current;
      if (!bridge?.isConnected) return;

      const raw = {
        streamState: streamStateRef.current ?? EMPTY_STREAM_STATE,
        componentList: registryRef.current.componentList,
        toolRegistry: registryRef.current.toolRegistry,
        mcpServerInfos: registryRef.current.mcpServerInfos,
      };

      const serialized = serializeForDevtools(raw);
      const snapshot: DevToolsStateSnapshot = {
        type: "state_snapshot",
        sessionId: sessionIdRef.current,
        timestamp: Date.now(),
        ...serialized,
      };

      bridge.send(snapshot);
    };

    const bridge = new DevToolsBridge({
      host,
      port,
      sessionId: sessionIdRef.current,
      sdkVersion: SDK_VERSION,
      projectId,
      onRequestSnapshot: sendSnapshot,
    });

    bridge.connect();
    bridgeRef.current = bridge;

    return () => {
      bridge.disconnect();
      bridgeRef.current = null;
    };
  }, [host, port, projectId]);

  // Debounced snapshot sending when state changes
  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const bridge = bridgeRef.current;
      if (!bridge?.isConnected) return;

      const raw = {
        streamState: streamState ?? EMPTY_STREAM_STATE,
        componentList: registry.componentList,
        toolRegistry: registry.toolRegistry,
        mcpServerInfos: registry.mcpServerInfos,
      };

      const serialized = serializeForDevtools(raw);
      const snapshot: DevToolsStateSnapshot = {
        type: "state_snapshot",
        sessionId: sessionIdRef.current,
        timestamp: Date.now(),
        ...serialized,
      };

      bridge.send(snapshot);
      debounceRef.current = null;
    }, SNAPSHOT_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [
    streamState,
    registry.componentList,
    registry.toolRegistry,
    registry.mcpServerInfos,
  ]);

  return null;
}
