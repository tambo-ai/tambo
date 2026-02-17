// NOTE: WS_NO_BUFFER_UTIL is set in instrumentation.ts BEFORE this module
// is imported, because webpack hoists imports above inline statements.

import { WebSocketServer } from "ws";

import { ConnectionManager } from "./connection-manager";
import { DEVTOOLS_PORT, HEARTBEAT_INTERVAL } from "./types";

const manager = new ConnectionManager();
const wss = new WebSocketServer({ port: DEVTOOLS_PORT, host: "0.0.0.0" });

wss.on("connection", (ws) => {
  manager.handleNewConnection(ws);
});

const heartbeatInterval = setInterval(() => {
  manager.runHeartbeat();
}, HEARTBEAT_INTERVAL);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
  manager.cleanup();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  clearInterval(heartbeatInterval);
  manager.cleanup();
  wss.close();
});

process.on("SIGINT", () => {
  clearInterval(heartbeatInterval);
  manager.cleanup();
  wss.close();
});

console.log(
  `[DevTools] WebSocket server listening on ws://localhost:${DEVTOOLS_PORT}`,
);
