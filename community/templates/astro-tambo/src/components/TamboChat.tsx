import { TamboProvider } from "@tambo-ai/react";
import { components, tools } from "@lib/tambo";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";

export default function TamboChat() {
  // Load MCP server configurations
  const mcpServers = useMcpServers();

  return (
    <TamboProvider
      apiKey={import.meta.env.PUBLIC_TAMBO_API_KEY ?? ""}
      components={components}
      tools={tools}
      tamboUrl={import.meta.env.PUBLIC_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <MessageThreadFull />
    </TamboProvider>
  );
}
