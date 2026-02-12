"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEVTOOLS_PORT } from "@/devtools-server/types";

export interface DevtoolsClient {
  sessionId: string;
  sdkVersion: string;
  projectId?: string;
  connectedAt: number;
}

export interface UseDevtoolsConnectionReturn {
  isConnected: boolean;
  clients: DevtoolsClient[];
  error: string | null;
}

interface DevtoolsConnectionOptions {
  port?: number;
  host?: string;
}

interface ServerMessage {
  type: string;
  clients?: DevtoolsClient[];
  sessionId?: string;
  sdkVersion?: string;
  projectId?: string;
  connectedAt?: number;
  snapshot?: object;
}

const RECONNECT_DELAY = 2000;

/**
 * Manages a WebSocket connection from the dashboard to the devtools server.
 * Tracks connection state and the list of connected SDK clients.
 *
 * @returns Connection state, client list, and error information.
 */
export function useDevtoolsConnection(
  options?: DevtoolsConnectionOptions,
): UseDevtoolsConnectionReturn {
  const port = options?.port ?? DEVTOOLS_PORT;
  const host = options?.host ?? "localhost";

  const [isConnected, setIsConnected] = useState(false);
  const [clients, setClients] = useState<DevtoolsClient[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isMountedRef = useRef(true);

  const handleMessage = useCallback((event: MessageEvent) => {
    let message: ServerMessage;
    try {
      message = JSON.parse(event.data as string) as ServerMessage;
    } catch {
      console.error("[DevTools] Failed to parse server message");
      return;
    }

    switch (message.type) {
      case "client_list": {
        if (message.clients) {
          setClients(message.clients);
        }
        break;
      }
      case "client_connected": {
        if (message.sessionId && message.sdkVersion) {
          setClients((prev) => [
            ...prev,
            {
              sessionId: message.sessionId!,
              sdkVersion: message.sdkVersion!,
              projectId: message.projectId,
              connectedAt: message.connectedAt ?? Date.now(),
            },
          ]);
        }
        break;
      }
      case "client_disconnected": {
        if (message.sessionId) {
          setClients((prev) =>
            prev.filter((c) => c.sessionId !== message.sessionId),
          );
        }
        break;
      }
      case "state_update": {
        // Phase 2 will use this for inspection panels
        break;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const connect = (): void => {
      if (!isMountedRef.current) return;

      const ws = new WebSocket(`ws://${host}:${port}`);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        if (!isMountedRef.current) return;
        ws.send(JSON.stringify({ type: "subscribe_dashboard" }));
        setIsConnected(true);
        setError(null);
      });

      ws.addEventListener("message", handleMessage);

      ws.addEventListener("close", () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, RECONNECT_DELAY);
      });

      ws.addEventListener("error", () => {
        if (!isMountedRef.current) return;
        setError("Failed to connect to devtools server");
      });
    };

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [host, port, handleMessage]);

  return { isConnected, clients, error };
}
