#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  CallToolResult,
  isInitializeRequest,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { Command } from "commander";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { randomUUID } from "node:crypto";
import { McpServiceRegistry } from "./mcp-service.js";
import { testService } from "./test-service.js";
// Create MCP service registry and register services
const serviceRegistry = new McpServiceRegistry();
serviceRegistry.registerService(testService);

// Server instance
const server = new Server(
  {
    name: "test-mcp-server",
    version: "0.0.1",
  },
  {
    capabilities: {
      prompts: { listChanged: true },
      tools: { listChanged: true },
    },
  },
);

// Setup server request handlers
// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: serviceRegistry.getAllTools(),
  };
});
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: serviceRegistry.getAllPrompts(),
  };
});
// Handle call tool request
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest): Promise<CallToolResult> => {
    const { name, arguments: args, _meta } = request.params;

    const handler = serviceRegistry.getHandler(name);
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return await handler(args, _meta, server);
  },
);

// Map to store transports by session ID for session management
const sessionTransports: {
  [sessionId: string]: StreamableHTTPServerTransport;
} = {};

// Server options interface
interface ServerOptions {
  port?: number;
  enableSessionManagement?: boolean;
  enableDnsRebindingProtection?: boolean;
  allowedHosts?: string[];
  allowedOrigins?: string[];
}

// Determine the port to use
function getDesiredPort(options: ServerOptions): number {
  // Priority: CLI flag > environment variable > default (3004)
  if (options.port) {
    return options.port;
  }
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return 3004;
}

// Function to check if a port is available
async function isPortAvailable(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

// Function to find an available port starting from the desired port
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  const maxAttempts = 100; // Prevent infinite loop
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
    attempts++;
  }

  throw new Error(
    `Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`,
  );
}

// Main function to start the server
async function main() {
  // Parse command line arguments
  const program = new Command();
  program
    .name("test-mcp-server")
    .description("A test MCP server with elicitation and sampling tools")
    .version("0.0.1")
    .option("-p, --port <number>", "port to listen on", (value: string) =>
      parseInt(value, 10),
    )
    .option(
      "--no-session-management",
      "disable session management (stateless mode)",
    )
    .option(
      "--enable-dns-rebinding-protection",
      "enable DNS rebinding protection",
    )
    .option(
      "--allowed-hosts <hosts>",
      "comma-separated list of allowed hosts for DNS rebinding protection",
    )
    .option(
      "--allowed-origins <origins>",
      "comma-separated list of allowed origins for DNS rebinding protection",
    )
    .parse(process.argv);

  const options = program.opts();

  // Process command line options
  const parseList = (v?: string): string[] | undefined => {
    const items = v
      ? v
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    return items.length > 0 ? items : undefined;
  };
  const serverOptions: ServerOptions = {
    port: options.port,
    enableSessionManagement: options.sessionManagement !== false, // Default to true unless explicitly disabled
    enableDnsRebindingProtection: options.enableDnsRebindingProtection || false,
    allowedHosts: parseList(options.allowedHosts),
    allowedOrigins: parseList(options.allowedOrigins),
  };

  // Log registered services
  const servicesInfo = serviceRegistry.getServicesInfo();
  console.error("Registered MCP services:");
  servicesInfo.forEach((service) => {
    console.error(
      `  - ${service.name}: ${service.toolCount} tools [${service.tools.join(", ")}]`,
    );
  });

  // Create Express app
  const app = express();
  app.use(express.json());

  try {
    const desiredPort = getDesiredPort(serverOptions);
    const port = await findAvailablePort(desiredPort);
    const enableSessionManagement =
      serverOptions.enableSessionManagement ?? true;
    app.use(
      "/mcp",
      cors({
        origin: "*", // use "*" with caution in production
        methods: "GET,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
        exposedHeaders: [
          "mcp-session-id",
          "last-event-id",
          "mcp-protocol-version",
        ],
      }),
    ); // Enable CORS for all routes so Inspector can connect

    // Handle POST requests for client-to-server communication
    app.post("/mcp", async (req, res) => {
      console.log("Received request", req.body);

      // Check for existing session ID
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      const transport = await initiateTransport(
        req,
        res,
        serverOptions,
        enableSessionManagement,
        sessionId,
      );
      // Handle the request
      if (!transport) {
        if (res.statusCode === 200) {
          res.status(400).send("Invalid or missing session ID");
        }
        return;
      }
      let originalErr: unknown;
      try {
        await transport.handleRequest(req, res, req.body);
      } catch (e) {
        originalErr = e;
      } finally {
        if (!enableSessionManagement) {
          try {
            console.log("no session management, closing transport");
            await transport.close();
          } catch (closeErr) {
            // Log cleanup failure but do not convert a successful request into an error
            console.error("Error closing transport", closeErr);
          }
        }
      }
      if (originalErr) throw originalErr;
    });

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (
      req: express.Request,
      res: express.Response,
    ) => {
      if (!enableSessionManagement) {
        res.status(400).send("Session management is disabled");
        return;
      }

      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (sessionId === undefined || !sessionTransports[sessionId]) {
        res.status(400).send("Invalid or missing session ID");
        return;
      }

      const transport = sessionTransports[sessionId];
      // Convert Express request/response to Node.js HTTP types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const httpReq = req as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const httpRes = res as any;
      await transport.handleRequest(httpReq, httpRes);
    };

    // Handle GET requests for server-to-client notifications via SSE
    app.get("/mcp", handleSessionRequest);

    // Handle DELETE requests for session termination
    app.delete("/mcp", handleSessionRequest);

    const host = process.env.HOST ?? "127.0.0.1";
    app.listen(port, host, () => {
      console.error(`Test MCP server running on http://${host}:${port}/mcp`);
      console.error(
        `Session management: ${enableSessionManagement ? "enabled" : "disabled"}`,
      );
      if (port !== desiredPort) {
        console.error(
          `Note: Started on port ${port} instead of requested port ${desiredPort} (port was not available)`,
        );
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function initiateTransport(
  req: express.Request,
  res: express.Response,
  serverOptions: ServerOptions,
  enableSessionManagement: boolean,
  sessionId?: string,
): Promise<StreamableHTTPServerTransport | undefined> {
  // Handle stateless mode first (early return)
  if (!enableSessionManagement) {
    console.log("no session management, creating new transport");
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableDnsRebindingProtection:
        serverOptions.enableDnsRebindingProtection ?? false,
      allowedHosts: serverOptions.allowedHosts,
      allowedOrigins: serverOptions.allowedOrigins,
    });
    await server.connect(transport);
    return transport;
  }

  // Session management enabled
  console.log("session management, checking for existing transport");

  // Reuse existing transport if available (early return)
  if (sessionId !== undefined && sessionId in sessionTransports) {
    const transport = sessionTransports[sessionId];
    return transport;
  }

  // Invalid request - not an initialization and no existing session (early return)
  if (!isInitializeRequest(req.body)) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided: ",
      },
      id: null,
    });
    return;
  }

  // Create new session-managed transport for initialization request
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessionTransports[sessionId] = transport;
      console.error(`New MCP session initialized: ${sessionId}`);
    },
    onsessionclosed: (sessionId) => {
      delete sessionTransports[sessionId];
      console.error(`MCP session closed: ${sessionId}`);
    },
    enableDnsRebindingProtection:
      serverOptions.enableDnsRebindingProtection ?? false,
    allowedHosts: serverOptions.allowedHosts,
    allowedOrigins: serverOptions.allowedOrigins,
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      delete sessionTransports[transport.sessionId];
    }
  };

  await server.connect(transport);
  return transport;
}

// Start the server
main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
