/**
 * Wire protocol type definitions for the Tambo DevTools bridge.
 *
 * Defines discriminated union message types for communication between:
 * - SDK client -> DevTools server (DevToolsMessage)
 * - DevTools server -> SDK client (DevToolsServerMessage)
 * - DevTools server -> Dashboard (DevToolsDashboardMessage)
 * - Dashboard -> DevTools server (DevToolsDashboardCommand)
 *
 * Pure TypeScript types only -- no runtime cost when tree-shaken.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default port for the devtools WebSocket server. */
export const DEVTOOLS_DEFAULT_PORT = 8265;

/** Default host for the devtools WebSocket server. */
export const DEVTOOLS_DEFAULT_HOST = "localhost";

/** Current protocol version for handshake negotiation. */
export const DEVTOOLS_PROTOCOL_VERSION = 1;

// ---------------------------------------------------------------------------
// SDK -> Server messages
// ---------------------------------------------------------------------------

/** Handshake sent on initial connection. */
export interface DevToolsHandshake {
  type: "handshake";
  protocolVersion: number;
  sdkVersion: string;
  projectId: string | undefined;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Serialized content types (safe for wire transmission)
// ---------------------------------------------------------------------------

/** Text content block. */
export interface SerializedTextContent {
  type: "text";
  text: string;
}

/** Tool use content block. */
export interface SerializedToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** Tool result content block. */
export interface SerializedToolResultContent {
  type: "tool_result";
  toolUseId: string;
  content: unknown;
  isError?: boolean;
}

/** Component content block (ReactElements stripped). */
export interface SerializedComponentContent {
  type: "component";
  name: string;
  props: Record<string, unknown>;
}

/** Resource content block. */
export interface SerializedResourceContent {
  type: "resource";
  uri: string;
  content: unknown;
}

/** Union of all serialized content block types. */
export type SerializedContent =
  | SerializedTextContent
  | SerializedToolUseContent
  | SerializedToolResultContent
  | SerializedComponentContent
  | SerializedResourceContent;

/** Serialized message for wire transmission. */
export interface SerializedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: SerializedContent[];
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

/** Streaming state for a thread. */
export interface SerializedStreamingState {
  status: "idle" | "streaming" | "waiting";
  runId?: string;
  messageId?: string;
  error?: { message: string; code?: string };
}

/** Error captured in the snapshot. */
export interface DevToolsError {
  type: "streaming" | "tool_call" | "connection";
  message: string;
  threadId?: string;
  timestamp: number;
}

/** Full state snapshot sent periodically or on significant changes. */
export interface DevToolsStateSnapshot {
  type: "state_snapshot";
  sessionId: string;
  timestamp: number;
  threads: {
    id: string;
    name?: string;
    status: "idle" | "streaming" | "waiting";
    messageCount: number;
    messages: SerializedMessage[];
    createdAt?: string;
    updatedAt?: string;
    streamingState?: SerializedStreamingState;
  }[];
  registry: {
    components: {
      name: string;
      description: string;
      propsSchema?: Record<string, unknown>;
    }[];
    tools: {
      name: string;
      description: string;
      inputSchema?: Record<string, unknown>;
      outputSchema?: Record<string, unknown>;
    }[];
    mcpServers?: {
      name: string;
      url: string;
      status: string;
    }[];
  };
  errors?: DevToolsError[];
}

// ---------------------------------------------------------------------------
// Serialized AG-UI event (for stream event forwarding)
// ---------------------------------------------------------------------------

/** A serialized AG-UI event safe for wire transmission. */
export interface SerializedAGUIEvent {
  type: string;
  timestamp?: number;
  [key: string]: unknown;
}

/** Individual stream event forwarded in real-time. */
export interface DevToolsStreamEvent {
  type: "stream_event";
  sessionId: string;
  timestamp: number;
  threadId: string;
  event: SerializedAGUIEvent;
  seq: number;
}

/** Heartbeat to keep connection alive. */
export interface DevToolsHeartbeat {
  type: "heartbeat";
  sessionId: string;
  timestamp: number;
}

/** All messages the SDK can send to the devtools server. */
export type DevToolsMessage =
  | DevToolsHandshake
  | DevToolsStateSnapshot
  | DevToolsHeartbeat
  | DevToolsStreamEvent;

// ---------------------------------------------------------------------------
// Server -> SDK messages
// ---------------------------------------------------------------------------

/** Acknowledgment of a successful handshake. */
export interface DevToolsHandshakeAck {
  type: "handshake_ack";
  sessionId: string;
  serverVersion: string;
}

/** Request the SDK to send a fresh state snapshot. */
export interface DevToolsRequestSnapshot {
  type: "request_snapshot";
}

/** All messages the devtools server can send to SDK clients. */
export type DevToolsServerMessage =
  | DevToolsHandshakeAck
  | DevToolsRequestSnapshot;

// ---------------------------------------------------------------------------
// Server -> Dashboard messages
// ---------------------------------------------------------------------------

/** Notification that an SDK client connected. */
export interface DevToolsClientConnected {
  type: "client_connected";
  sessionId: string;
  sdkVersion: string;
  projectId?: string;
}

/** Notification that an SDK client disconnected. */
export interface DevToolsClientDisconnected {
  type: "client_disconnected";
  sessionId: string;
}

/** State update forwarded from an SDK client. */
export interface DevToolsStateUpdate {
  type: "state_update";
  sessionId: string;
  snapshot: DevToolsStateSnapshot;
}

/** List of currently connected SDK clients. */
export interface DevToolsClientList {
  type: "client_list";
  clients: {
    sessionId: string;
    sdkVersion: string;
    projectId?: string;
    connectedAt: number;
  }[];
}

/** All messages the devtools server can send to dashboard clients. */
export type DevToolsDashboardMessage =
  | DevToolsClientConnected
  | DevToolsClientDisconnected
  | DevToolsStateUpdate
  | DevToolsClientList;

// ---------------------------------------------------------------------------
// Dashboard -> Server commands
// ---------------------------------------------------------------------------

/** Request the server to send the current client list. */
export interface DevToolsRequestClientList {
  type: "request_client_list";
}

/** Request the server to ask a specific SDK client for a snapshot. */
export interface DevToolsRequestClientSnapshot {
  type: "request_client_snapshot";
  sessionId: string;
}

/** All commands the dashboard can send to the devtools server. */
export type DevToolsDashboardCommand =
  | DevToolsRequestClientList
  | DevToolsRequestClientSnapshot;
