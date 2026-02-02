<script lang="ts" module>
  import type { McpServerInfo } from "../types.js";

  export interface McpTool {
    name: string;
    description: string;
    serverName: string;
    inputSchema?: unknown;
  }

  export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    serverName: string;
  }

  export interface McpPrompt {
    name: string;
    description?: string;
    serverName: string;
    arguments?: Array<{
      name: string;
      description?: string;
      required?: boolean;
    }>;
  }

  export interface ConnectedMcpServer {
    name: string;
    status: "connected";
    tools: McpTool[];
    resources: McpResource[];
    prompts: McpPrompt[];
  }

  export interface FailedMcpServer {
    name: string;
    status: "failed";
    error: string;
  }

  export type McpServer = ConnectedMcpServer | FailedMcpServer;

  export interface TamboMcpContext {
    servers: McpServer[];
    tools: McpTool[];
    resources: McpResource[];
    prompts: McpPrompt[];
    isConnecting: boolean;
    callTool: (
      serverName: string,
      toolName: string,
      args: Record<string, unknown>,
    ) => Promise<unknown>;
    getResource: (serverName: string, uri: string) => Promise<unknown>;
    getPrompt: (
      serverName: string,
      promptName: string,
      args?: Record<string, string>,
    ) => Promise<unknown>;
  }
</script>

<script lang="ts">
  import { setContext, onMount, onDestroy } from "svelte";
  import type { Snippet } from "svelte";
  import { TAMBO_MCP_KEY } from "../context.js";

  interface Props {
    mcpServers?: McpServerInfo[];
    children: Snippet;
  }

  const { mcpServers = [], children }: Props = $props();

  // State
  let servers = $state<McpServer[]>([]);
  let isConnecting = $state(false);

  // Derived state
  const tools = $derived(
    servers
      .filter((s): s is ConnectedMcpServer => s.status === "connected")
      .flatMap((s) => s.tools),
  );

  const resources = $derived(
    servers
      .filter((s): s is ConnectedMcpServer => s.status === "connected")
      .flatMap((s) => s.resources),
  );

  const prompts = $derived(
    servers
      .filter((s): s is ConnectedMcpServer => s.status === "connected")
      .flatMap((s) => s.prompts),
  );

  // MCP connection logic would go here
  // For now, this is a placeholder that doesn't actually connect
  // Full MCP support requires @modelcontextprotocol/sdk which is optional

  onMount(async () => {
    if (mcpServers.length === 0) {
      return;
    }

    isConnecting = true;

    // Placeholder: In a full implementation, this would:
    // 1. Import @modelcontextprotocol/sdk dynamically
    // 2. Create clients for each server based on transport type
    // 3. Connect and discover tools/resources/prompts
    // 4. Update the servers state

    // For now, mark all as failed since we don't have actual MCP support yet
    servers = mcpServers.map((config) => ({
      name: config.name,
      status: "failed" as const,
      error:
        "MCP support requires @modelcontextprotocol/sdk to be installed and configured",
    }));

    isConnecting = false;
  });

  onDestroy(() => {
    // Cleanup MCP connections
    servers = [];
  });

  async function callTool(
    serverName: string,
    _toolName: string,
    _args: Record<string, unknown>,
  ): Promise<unknown> {
    const server = servers.find(
      (s) => s.name === serverName && s.status === "connected",
    );
    if (!server) {
      throw new Error(`MCP server "${serverName}" not connected`);
    }

    // Placeholder - would call the actual MCP client
    throw new Error("MCP tool calls not yet implemented");
  }

  async function getResource(
    serverName: string,
    _uri: string,
  ): Promise<unknown> {
    const server = servers.find(
      (s) => s.name === serverName && s.status === "connected",
    );
    if (!server) {
      throw new Error(`MCP server "${serverName}" not connected`);
    }

    // Placeholder - would call the actual MCP client
    throw new Error("MCP resource fetching not yet implemented");
  }

  async function getPrompt(
    serverName: string,
    _promptName: string,
    _args?: Record<string, string>,
  ): Promise<unknown> {
    const server = servers.find(
      (s) => s.name === serverName && s.status === "connected",
    );
    if (!server) {
      throw new Error(`MCP server "${serverName}" not connected`);
    }

    // Placeholder - would call the actual MCP client
    throw new Error("MCP prompt fetching not yet implemented");
  }

  const context: TamboMcpContext = {
    get servers() {
      return servers;
    },
    get tools() {
      return tools;
    },
    get resources() {
      return resources;
    },
    get prompts() {
      return prompts;
    },
    get isConnecting() {
      return isConnecting;
    },
    callTool,
    getResource,
    getPrompt,
  };

  setContext(TAMBO_MCP_KEY, context);
</script>

{@render children()}
