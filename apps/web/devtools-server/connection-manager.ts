import { WebSocket } from "ws";

import type {
  ClientInfo,
  ConnectedDashboardClient,
  ConnectedSdkClient,
  DashboardCommand,
  SdkMessage,
  ServerToDashboardMessage,
} from "./types";
import { SERVER_VERSION } from "./types";

/**
 * Manages SDK and dashboard WebSocket connections for the devtools server.
 *
 * Tracks connected SDK clients, routes messages between SDK instances and
 * dashboard clients, and handles heartbeat-based connection cleanup.
 */
export class ConnectionManager {
  private sdkClients = new Map<string, ConnectedSdkClient>();
  private dashboardClients = new Map<string, ConnectedDashboardClient>();

  /**
   * Handles a new WebSocket connection. The first message determines
   * whether the connection is an SDK client (handshake) or a dashboard
   * client (subscribe_dashboard).
   *
   * @returns void
   */
  handleNewConnection(ws: WebSocket): void {
    const onFirstMessage = (data: Buffer): void => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        console.error("[DevTools] Failed to parse initial message");
        return;
      }

      const message = parsed as SdkMessage | DashboardCommand;

      if (message.type === "handshake") {
        this.registerSdkClient(
          ws,
          message as SdkMessage & { type: "handshake" },
        );
        ws.off("message", onFirstMessage);
        ws.on("message", (msgData: Buffer) => {
          this.handleRawSdkMessage(
            (message as SdkMessage & { type: "handshake" }).sessionId,
            msgData,
          );
        });
      } else if (message.type === "subscribe_dashboard") {
        this.registerDashboardClient(ws);
        ws.off("message", onFirstMessage);
        ws.on("message", (msgData: Buffer) => {
          this.handleRawDashboardCommand(ws, msgData);
        });
      } else {
        console.error(
          `[DevTools] Unexpected first message type: ${message.type}`,
        );
      }
    };

    ws.on("message", onFirstMessage);
  }

  /**
   * Sends a message to all connected dashboard clients whose WebSocket
   * connection is in the OPEN state.
   *
   * @returns void
   */
  broadcastToDashboard(message: ServerToDashboardMessage): void {
    const payload = JSON.stringify(message);
    for (const [id, client] of this.dashboardClients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      } else {
        this.dashboardClients.delete(id);
      }
    }
  }

  /**
   * Runs a heartbeat check on all SDK clients. Terminates clients that
   * did not respond to the previous ping, then sends a new ping to
   * remaining clients.
   *
   * @returns void
   */
  runHeartbeat(): void {
    for (const [sessionId, client] of this.sdkClients) {
      if (!client.isAlive) {
        client.ws.terminate();
        this.sdkClients.delete(sessionId);
        this.broadcastToDashboard({
          type: "client_disconnected",
          sessionId,
        });
        continue;
      }
      client.isAlive = false;
      client.ws.ping();
    }
  }

  /**
   * Returns metadata for all currently connected SDK clients.
   *
   * @returns Array of client info objects (without WebSocket references).
   */
  getClientList(): ClientInfo[] {
    return Array.from(this.sdkClients.values()).map((client) => ({
      sessionId: client.sessionId,
      sdkVersion: client.sdkVersion,
      projectId: client.projectId,
      connectedAt: client.connectedAt,
    }));
  }

  /**
   * Closes all connections and clears internal state.
   *
   * @returns void
   */
  cleanup(): void {
    for (const client of this.sdkClients.values()) {
      client.ws.terminate();
    }
    for (const client of this.dashboardClients.values()) {
      client.ws.terminate();
    }
    this.sdkClients.clear();
    this.dashboardClients.clear();
  }

  private registerSdkClient(
    ws: WebSocket,
    message: SdkMessage & { type: "handshake" },
  ): void {
    const client: ConnectedSdkClient = {
      ws,
      sessionId: message.sessionId,
      sdkVersion: message.sdkVersion,
      projectId: message.projectId,
      connectedAt: Date.now(),
      isAlive: true,
    };

    this.sdkClients.set(message.sessionId, client);

    // Send handshake acknowledgment
    ws.send(
      JSON.stringify({
        type: "handshake_ack",
        sessionId: message.sessionId,
        serverVersion: SERVER_VERSION,
      }),
    );

    // Broadcast to dashboard clients
    this.broadcastToDashboard({
      type: "client_connected",
      sessionId: message.sessionId,
      sdkVersion: message.sdkVersion,
      projectId: message.projectId,
      connectedAt: client.connectedAt,
    });

    // Handle close
    ws.on("close", () => {
      this.sdkClients.delete(message.sessionId);
      this.broadcastToDashboard({
        type: "client_disconnected",
        sessionId: message.sessionId,
      });
    });

    // Handle pong for heartbeat
    ws.on("pong", () => {
      const existing = this.sdkClients.get(message.sessionId);
      if (existing) {
        existing.isAlive = true;
      }
    });

    console.log(
      `[DevTools] SDK client connected: ${message.sessionId} (v${message.sdkVersion})`,
    );
  }

  private registerDashboardClient(ws: WebSocket): void {
    const id = crypto.randomUUID();
    const client: ConnectedDashboardClient = { ws, id };
    this.dashboardClients.set(id, client);

    // Send current client list immediately
    ws.send(
      JSON.stringify({
        type: "client_list",
        clients: this.getClientList(),
      }),
    );

    // Handle close
    ws.on("close", () => {
      this.dashboardClients.delete(id);
      console.log(`[DevTools] Dashboard client disconnected: ${id}`);
    });

    console.log(`[DevTools] Dashboard client connected: ${id}`);
  }

  private handleRawSdkMessage(sessionId: string, data: Buffer): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      console.error(`[DevTools] Failed to parse SDK message from ${sessionId}`);
      return;
    }

    const message = parsed as SdkMessage;
    this.handleSdkMessage(sessionId, message);
  }

  private handleSdkMessage(sessionId: string, message: SdkMessage): void {
    switch (message.type) {
      case "state_snapshot": {
        this.broadcastToDashboard({
          type: "state_update",
          sessionId,
          snapshot: {
            sessionId: message.sessionId,
            timestamp: message.timestamp,
            threads: message.threads,
            registry: message.registry,
            ...(message.errors ? { errors: message.errors } : {}),
          },
        });
        break;
      }
      case "heartbeat": {
        const client = this.sdkClients.get(sessionId);
        if (client) {
          client.isAlive = true;
        }
        break;
      }
      default:
        // handshake is handled during registration, not here
        break;
    }
  }

  private handleRawDashboardCommand(ws: WebSocket, data: Buffer): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      console.error("[DevTools] Failed to parse dashboard command");
      return;
    }

    const command = parsed as DashboardCommand;
    this.handleDashboardCommand(ws, command);
  }

  private handleDashboardCommand(
    ws: WebSocket,
    command: DashboardCommand,
  ): void {
    switch (command.type) {
      case "request_client_list": {
        ws.send(
          JSON.stringify({
            type: "client_list",
            clients: this.getClientList(),
          }),
        );
        break;
      }
      case "request_client_snapshot": {
        const sdkClient = this.sdkClients.get(command.sessionId);
        if (sdkClient && sdkClient.ws.readyState === WebSocket.OPEN) {
          sdkClient.ws.send(JSON.stringify({ type: "request_snapshot" }));
        }
        break;
      }
      default:
        // subscribe_dashboard is handled during registration, not here
        break;
    }
  }
}
