import type { WebSocket } from "ws";

// --- Constants ---

export const DEVTOOLS_PORT = 8265;
export const HEARTBEAT_INTERVAL = 30_000;
export const SERVER_VERSION = "0.1.0";

// --- SDK -> Server messages ---

interface HandshakeMessage {
  type: "handshake";
  protocolVersion: number;
  sdkVersion: string;
  projectId?: string;
  sessionId: string;
}

interface StateSnapshotMessage {
  type: "state_snapshot";
  sessionId: string;
  timestamp: number;
  threads: Array<{
    id: string;
    name?: string;
    status: "idle" | "streaming" | "waiting";
    messageCount: number;
  }>;
  registry: {
    components: Array<{
      name: string;
      description: string;
    }>;
    tools: Array<{
      name: string;
      description: string;
    }>;
  };
}

interface HeartbeatMessage {
  type: "heartbeat";
  sessionId: string;
  timestamp: number;
}

export type SdkMessage =
  | HandshakeMessage
  | StateSnapshotMessage
  | HeartbeatMessage;

// --- Server -> SDK messages ---

interface HandshakeAckMessage {
  type: "handshake_ack";
  sessionId: string;
  serverVersion: string;
}

interface RequestSnapshotMessage {
  type: "request_snapshot";
}

export type ServerToSdkMessage = HandshakeAckMessage | RequestSnapshotMessage;

// --- Server -> Dashboard messages ---

interface ClientConnectedMessage {
  type: "client_connected";
  sessionId: string;
  sdkVersion: string;
  projectId?: string;
  connectedAt: number;
}

interface ClientDisconnectedMessage {
  type: "client_disconnected";
  sessionId: string;
}

interface StateUpdateMessage {
  type: "state_update";
  sessionId: string;
  snapshot: object;
}

export interface ClientInfo {
  sessionId: string;
  sdkVersion: string;
  projectId?: string;
  connectedAt: number;
}

interface ClientListMessage {
  type: "client_list";
  clients: ClientInfo[];
}

export type ServerToDashboardMessage =
  | ClientConnectedMessage
  | ClientDisconnectedMessage
  | StateUpdateMessage
  | ClientListMessage;

// --- Dashboard -> Server messages ---

interface SubscribeDashboardCommand {
  type: "subscribe_dashboard";
}

interface RequestClientListCommand {
  type: "request_client_list";
}

interface RequestClientSnapshotCommand {
  type: "request_client_snapshot";
  sessionId: string;
}

export type DashboardCommand =
  | SubscribeDashboardCommand
  | RequestClientListCommand
  | RequestClientSnapshotCommand;

// --- Connected client tracking ---

export interface ConnectedSdkClient {
  ws: WebSocket;
  sessionId: string;
  sdkVersion: string;
  projectId?: string;
  connectedAt: number;
  isAlive: boolean;
}

export interface ConnectedDashboardClient {
  ws: WebSocket;
  id: string;
}
