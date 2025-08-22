import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Express } from "express";
import { createServer } from "http";

export interface ServerOptions {
  port?: number;
}

// Determine the port to use
export function getDesiredPort(options: ServerOptions): number {
  // Priority: CLI flag > environment variable > default (3003)
  if (options.port) {
    return options.port;
  }
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return 3003;
}

// Function to check if a port is available
export async function isPortAvailable(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

// Function to find an available port starting from the desired port
export async function findAvailablePort(startPort: number): Promise<number> {
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

// Start the MCP server with HTTP transport
export async function startMCPServer(
  mcpServer: Server,
  app: Express,
  options: ServerOptions,
): Promise<void> {
  try {
    const desiredPort = getDesiredPort(options);
    const port = await findAvailablePort(desiredPort);

    const transport = new StreamableHTTPServerTransport({
      // creates stateless sessions
      sessionIdGenerator: undefined,
    });

    app.post("/mcp", async (req, res) => {
      await transport.handleRequest(req, res);
    });

    await mcpServer.connect(transport);

    app.listen(port, () => {
      console.error(
        `Tambo MCP proxy server running on http://localhost:${port}/mcp`,
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
