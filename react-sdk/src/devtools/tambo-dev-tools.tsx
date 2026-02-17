"use client";

import * as React from "react";

import { TamboClientContext } from "../providers/tambo-client-provider";
import { TamboRegistryContext } from "../providers/tambo-registry-provider";
import { RawEventCallbackContext } from "../v1/providers/tambo-v1-stream-context";
import type { StreamState } from "../v1/utils/event-accumulator";
import { DevToolsBridge } from "./devtools-bridge";
import type { DevToolsStateSnapshot } from "./devtools-protocol";
import { DEVTOOLS_DEFAULT_HOST } from "./devtools-protocol";
import TamboDevToolsTrigger from "./devtools-trigger";
import type { SummaryStats } from "./devtools-trigger";
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
  /** Whether to show the floating trigger button. Defaults to true. */
  showTrigger?: boolean;
}

/** Port used by the Tambo Cloud dashboard (web app). */
const DASHBOARD_PORT = 8260;

/**
 * Derives the full devtools dashboard URL from the WS connection host.
 * @param wsHost - WebSocket server hostname
 * @param sessionId - Current devtools session ID
 * @returns The dashboard URL with clientId query parameter.
 */
function deriveDashboardUrl(wsHost: string, sessionId: string): string {
  const url = new URL(`http://${wsHost}:${DASHBOARD_PORT}/devtools`);
  url.searchParams.set("clientId", sessionId);
  return url.toString();
}

/**
 * Computes summary stats from registry and stream state for the trigger popover.
 * @param registry - The current registry context value
 * @param registry.componentList - Map of registered component names to metadata
 * @param registry.toolRegistry - Map of registered tool names to metadata
 * @param streamState - The current stream state (or null)
 * @returns Computed summary statistics.
 */
function getStatsFromSnapshot(
  registry: {
    componentList: Record<string, unknown>;
    toolRegistry: Record<string, unknown>;
  },
  streamState: StreamState | null,
): SummaryStats {
  const threadMap = streamState?.threadMap ?? {};
  const threadEntries = Object.entries(threadMap);

  const streamingThread = threadEntries.find(
    ([, ts]) => ts.streaming.status === "streaming",
  );

  return {
    componentCount: Object.keys(registry.componentList).length,
    toolCount: Object.keys(registry.toolRegistry).length,
    threadCount: threadEntries.length,
    activeThread: streamingThread?.[0] ?? streamState?.currentThreadId,
    isStreaming: streamingThread !== undefined,
    errorCount: 0,
  };
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
 * @param props.port - Port of the devtools WebSocket server (default: 8265)
 * @param props.host - Host of the devtools WebSocket server (default: "localhost")
 * @param props.showTrigger - Whether to show the floating trigger button (default: true)
 * @returns A React component that manages the devtools connection and state synchronization.
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
export function TamboDevTools({
  port,
  host,
  showTrigger = true,
}: TamboDevToolsProps) {
  // Read projectId from TamboProvider context if available.
  // Uses useContext directly (not the throwing useTamboClient hook) so
  // the component degrades gracefully outside of TamboProvider.
  const clientContext = React.useContext(TamboClientContext);
  const projectId = clientContext?.client.apiKey ?? undefined;

  // Read registry context (degrades gracefully with defaults)
  const registry = React.useContext(TamboRegistryContext);

  // Read stream state context if available (returns null outside TamboStreamProvider)
  const streamState = useStreamStateForDevtools();

  // Access the raw event callback ref from the stream context (for event forwarding)
  const rawEventCallbackRef = React.useContext(RawEventCallbackContext);

  // Stable session ID across re-renders
  const sessionIdRef = React.useRef(crypto.randomUUID());

  // Bridge persisted across renders
  const bridgeRef = React.useRef<DevToolsBridge | null>(null);

  // Debounce timer ref
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track bridge connection state for the trigger UI
  const [isConnected, setIsConnected] = React.useState(false);

  // Compute stats for the trigger popover
  const stats = React.useMemo(
    () => getStatsFromSnapshot(registry, streamState),
    [registry, streamState],
  );

  // Compute dashboard URL
  const wsHost = host ?? DEVTOOLS_DEFAULT_HOST;
  const dashboardUrl = React.useMemo(
    () => deriveDashboardUrl(wsHost, sessionIdRef.current),
    [wsHost],
  );

  // Keep latest values in refs so the sendSnapshot closure is always current
  const streamStateRef = React.useRef(streamState);
  streamStateRef.current = streamState;
  const registryRef = React.useRef(registry);
  registryRef.current = registry;

  // Create bridge on mount, clean up on unmount
  React.useEffect(() => {
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
      onConnectionChange: setIsConnected,
    });

    bridge.connect();
    bridgeRef.current = bridge;

    return () => {
      bridge.disconnect();
      bridgeRef.current = null;
      setIsConnected(false);
    };
  }, [host, port, projectId]);

  // Register raw event callback for devtools event forwarding
  React.useEffect(() => {
    if (!rawEventCallbackRef) return;

    rawEventCallbackRef.current = (event: unknown, threadId: string) => {
      bridgeRef.current?.emitEvent(event, threadId);
    };

    return () => {
      if (rawEventCallbackRef.current) {
        rawEventCallbackRef.current = null;
      }
    };
  }, [rawEventCallbackRef]);

  // Debounced snapshot sending when state changes
  React.useEffect(() => {
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

  if (!showTrigger) return null;

  return (
    <TamboDevToolsTrigger
      isConnected={isConnected}
      stats={stats}
      dashboardUrl={dashboardUrl}
    />
  );
}
