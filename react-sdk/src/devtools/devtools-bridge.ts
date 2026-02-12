import { WebSocket as ReconnectingWebSocket } from "partysocket";

import type {
  DevToolsMessage,
  DevToolsServerMessage,
} from "./devtools-protocol";
import {
  DEVTOOLS_DEFAULT_HOST,
  DEVTOOLS_DEFAULT_PORT,
  DEVTOOLS_PROTOCOL_VERSION,
} from "./devtools-protocol";

/**
 * Configuration options for the DevToolsBridge.
 */
export interface DevToolsBridgeOptions {
  /** Host of the devtools WebSocket server. Defaults to "localhost". */
  host?: string;
  /** Port of the devtools WebSocket server. Defaults to 8265. */
  port?: number;
  /** Unique session identifier for this SDK instance. */
  sessionId: string;
  /** Version of the React SDK (from package.json). */
  sdkVersion: string;
  /** Project identifier from the TamboProvider API key. */
  projectId?: string;
  /** Callback invoked when the server requests a fresh snapshot. */
  onRequestSnapshot?: () => void;
}

/**
 * WebSocket client that connects to the Tambo DevTools server.
 *
 * Uses partysocket for automatic reconnection with exponential backoff.
 * Sends a handshake on connection and provides a typed `send` interface
 * for DevToolsMessage payloads.
 *
 * Zero work when disconnected: messages are silently dropped (not buffered)
 * when the WebSocket is not connected.
 */
export class DevToolsBridge {
  private ws: ReconnectingWebSocket | null = null;
  private connected = false;
  private readonly options: DevToolsBridgeOptions;

  constructor(options: DevToolsBridgeOptions) {
    this.options = options;
  }

  /**
   * Opens a WebSocket connection to the devtools server.
   * Sends a handshake message once the connection is established.
   */
  connect(): void {
    const host = this.options.host ?? DEVTOOLS_DEFAULT_HOST;
    const port = this.options.port ?? DEVTOOLS_DEFAULT_PORT;
    const url = `ws://${host}:${port}`;

    this.ws = new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: 10_000,
      minReconnectionDelay: 1_000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4_000,
      maxRetries: Infinity,
      maxEnqueuedMessages: 0,
    });

    this.ws.addEventListener("open", () => {
      this.connected = true;
      this.send({
        type: "handshake",
        protocolVersion: DEVTOOLS_PROTOCOL_VERSION,
        sdkVersion: this.options.sdkVersion,
        projectId: this.options.projectId,
        sessionId: this.options.sessionId,
      });
    });

    this.ws.addEventListener("close", () => {
      this.connected = false;
    });

    this.ws.addEventListener("message", (event) => {
      this.handleServerMessage(event.data);
    });
  }

  /**
   * Sends a message to the devtools server.
   * Silently drops messages when not connected (zero buffering).
   * @param message - The message to send
   */
  send(message: DevToolsMessage): void {
    if (!this.connected || !this.ws) {
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Closes the WebSocket connection and cleans up resources.
   */
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  /**
   * Whether the bridge currently has an active connection.
   * @returns true if connected, false otherwise
   */
  get isConnected(): boolean {
    return this.connected;
  }

  /**
   * Handles incoming messages from the devtools server.
   * In Phase 1 this logs the handshake ack and ignores snapshot requests.
   */
  private handleServerMessage(data: unknown): void {
    if (typeof data !== "string") {
      return;
    }

    try {
      const message = JSON.parse(data) as DevToolsServerMessage;

      switch (message.type) {
        case "handshake_ack":
          // Connection confirmed by server -- no further action needed in Phase 1
          break;
        case "request_snapshot":
          this.options.onRequestSnapshot?.();
          break;
      }
    } catch {
      // Silently ignore malformed messages
    }
  }
}
