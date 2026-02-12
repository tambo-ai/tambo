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

// --- Serialized content types (mirrors SDK protocol) ---

export interface SerializedTextContent {
  type: "text";
  text: string;
}

export interface SerializedToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface SerializedToolResultContent {
  type: "tool_result";
  toolUseId: string;
  content: unknown;
  isError?: boolean;
}

export interface SerializedComponentContent {
  type: "component";
  name: string;
  props: Record<string, unknown>;
}

export interface SerializedResourceContent {
  type: "resource";
  uri: string;
  content: unknown;
}

export type SerializedContent =
  | SerializedTextContent
  | SerializedToolUseContent
  | SerializedToolResultContent
  | SerializedComponentContent
  | SerializedResourceContent;

export interface SerializedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: SerializedContent[];
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface SerializedStreamingState {
  status: "idle" | "streaming" | "waiting";
  runId?: string;
  messageId?: string;
  error?: { message: string; code?: string };
}

export interface DevToolsError {
  type: "streaming" | "tool_call" | "connection";
  message: string;
  threadId?: string;
  timestamp: number;
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
    messages: SerializedMessage[];
    createdAt?: string;
    updatedAt?: string;
    streamingState?: SerializedStreamingState;
  }>;
  registry: {
    components: Array<{
      name: string;
      description: string;
      propsSchema?: Record<string, unknown>;
    }>;
    tools: Array<{
      name: string;
      description: string;
      inputSchema?: Record<string, unknown>;
      outputSchema?: Record<string, unknown>;
    }>;
    mcpServers?: Array<{
      name: string;
      url: string;
      status: string;
    }>;
  };
  errors?: DevToolsError[];
}

/** Snapshot payload without the envelope fields, for storage in dashboard state. */
export type StateSnapshot = Omit<StateSnapshotMessage, "type">;

interface HeartbeatMessage {
  type: "heartbeat";
  sessionId: string;
  timestamp: number;
}

interface StreamEventMessage {
  type: "stream_event";
  sessionId: string;
  timestamp: number;
  threadId: string;
  event: { type: string; [key: string]: unknown };
  seq: number;
}

export type SdkMessage =
  | HandshakeMessage
  | StateSnapshotMessage
  | HeartbeatMessage
  | StreamEventMessage;

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
  snapshot: StateSnapshot;
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

export interface StreamEventUpdateMessage {
  type: "stream_event_update";
  sessionId: string;
  event: StreamEventMessage;
}

export type ServerToDashboardMessage =
  | ClientConnectedMessage
  | ClientDisconnectedMessage
  | StateUpdateMessage
  | ClientListMessage
  | StreamEventUpdateMessage;

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
