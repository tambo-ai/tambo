#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { Command } from "commander";
import express from "express";
import { McpServiceRegistry } from "./mcp-service.js";
import { startMCPServer } from "./server.js";
import { weatherService } from "./weather-service.js";

// see https://github.com/modelcontextprotocol/servers/blob/main/src/everything/streamableHttp.ts
// for a more complete example of how to use the StreamableHTTPServerTransport, and still have sessions, etc

const app = express();

// Parse command line arguments
const program = new Command();
program
  .name("tambo-mcp-proxy")
  .description(
    "A proxy for Tambo that connects to all known MCP servers for a given project",
  )
  .version("0.1.0")
  .option("-p, --port <number>", "port to listen on", (value: string) =>
    parseInt(value, 10),
  )
  .parse(process.argv);

const options = program.opts();

// Create MCP service registry and register services
const serviceRegistry = new McpServiceRegistry();
serviceRegistry.registerService(weatherService);

// Server instance
const server = new Server(
  {
    name: "tambo-mcp-proxy",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
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

// Handle call tool request
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    const handler = serviceRegistry.getHandler(name);
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return await handler(args);
  },
);

// Start the server using the utilities
async function main() {
  // Log registered services
  const servicesInfo = serviceRegistry.getServicesInfo();
  console.error("Registered MCP services:");
  servicesInfo.forEach((service) => {
    console.error(
      `  - ${service.name}: ${service.toolCount} tools [${service.tools.join(", ")}]`,
    );
  });

  await startMCPServer(server, app, { port: options.port });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
