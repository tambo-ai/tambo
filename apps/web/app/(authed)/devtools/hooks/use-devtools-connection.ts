"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEVTOOLS_PORT } from "@/devtools-server/types";
import type { StateSnapshot } from "@/devtools-server/types";

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
  snapshots: Map<string, StateSnapshot>;
  selectedSessionId: string | null;
  setSelectedSessionId: (sessionId: string | null) => void;
  requestSnapshot: (sessionId: string) => void;
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
  snapshot?: StateSnapshot;
}

const RECONNECT_DELAY = 2000;

/**
 * Manages a WebSocket connection from the dashboard to the devtools server.
 * Tracks connection state, the list of connected SDK clients, and per-session
 * state snapshots.
 *
 * @returns Connection state, client list, snapshots, selection, and error information.
 */
export function useDevtoolsConnection(
  options?: DevtoolsConnectionOptions,
): UseDevtoolsConnectionReturn {
  const port = options?.port ?? DEVTOOLS_PORT;
  const host = options?.host ?? "localhost";

  const [isConnected, setIsConnected] = useState(false);
  const [clients, setClients] = useState<DevtoolsClient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Map<string, StateSnapshot>>(
    () => new Map(),
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

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
          const newClient: DevtoolsClient = {
            sessionId: message.sessionId,
            sdkVersion: message.sdkVersion,
            projectId: message.projectId,
            connectedAt: message.connectedAt ?? Date.now(),
          };
          setClients((prev) => [...prev, newClient]);

          // Auto-select first connected client
          setSelectedSessionId((prev) => prev ?? message.sessionId!);
        }
        break;
      }
      case "client_disconnected": {
        if (message.sessionId) {
          const disconnectedId = message.sessionId;
          setClients((prev) =>
            prev.filter((c) => c.sessionId !== disconnectedId),
          );
          setSnapshots((prev) => {
            const next = new Map(prev);
            next.delete(disconnectedId);
            return next;
          });
          setSelectedSessionId((prev) => {
            if (prev === disconnectedId) return null;
            return prev;
          });
        }
        break;
      }
      case "state_update": {
        if (message.sessionId && message.snapshot) {
          const sessionId = message.sessionId;
          const snapshot = message.snapshot;
          setSnapshots((prev) => new Map(prev).set(sessionId, snapshot));
        }
        break;
      }
    }
  }, []);

  const requestSnapshot = useCallback((sessionId: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "request_client_snapshot", sessionId }));
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

  return {
    isConnected,
    clients,
    error,
    snapshots,
    selectedSessionId,
    setSelectedSessionId,
    requestSnapshot,
  };
}
