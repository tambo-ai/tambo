"use client";

import { useContext, useEffect } from "react";

import { TamboClientContext } from "../providers/tambo-client-provider";
import { DevToolsBridge } from "./devtools-bridge";

/**
 * SDK version string sent in the devtools handshake.
 * TODO: Automate injection from package.json during the release process.
 */
const SDK_VERSION = "1.0.1";

/**
 * Props for the TamboDevTools component.
 */
export interface TamboDevToolsProps {
  /** Port of the devtools WebSocket server. Defaults to 8265. */
  port?: number;
  /** Host of the devtools WebSocket server. Defaults to "localhost". */
  host?: string;
}

/**
 * Opt-in devtools bridge component.
 *
 * Place inside `<TamboProvider>` to enable a WebSocket connection to the
 * Tambo DevTools server. This component renders nothing visible. It
 * establishes a connection on mount, sends a handshake with SDK metadata,
 * and disconnects cleanly on unmount.
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

  useEffect(() => {
    const bridge = new DevToolsBridge({
      host,
      port,
      sessionId: crypto.randomUUID(),
      sdkVersion: SDK_VERSION,
      projectId,
    });

    bridge.connect();

    return () => {
      bridge.disconnect();
    };
  }, [host, port, projectId]);

  return null;
}
