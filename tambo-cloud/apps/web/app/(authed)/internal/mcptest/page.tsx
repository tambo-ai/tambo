"use client";
import { MCPTransport } from "@tambo-ai-cloud/core";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";

const tamboMCP = {
  url: "https://mcp.inkeep.com/tamboco/mcp",
  transport: MCPTransport.HTTP,
};

export default function McpTestPage() {
  return (
    <TamboMcpProvider mcpServers={[tamboMCP]}>
      <div>McpTestPage</div>
    </TamboMcpProvider>
  );
}
