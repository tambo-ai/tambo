"use client";

import { CLI } from "@/components/cli";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { MCPTransport, TamboMcpProvider } from "@tambo-ai/react/mcp";
import { DemoWrapper } from "../../demo-wrapper";

const MCP_DEMO_URL =
  process.env.NEXT_PUBLIC_MCP_DEMO_URL || "https://everything-mcp.tambo.co/mcp";

function MessageThreadFullContent() {
  const userContextKey = useUserContextKey("message-thread-full");

  return (
    <TamboMcpProvider
      mcpServers={[{ url: MCP_DEMO_URL, transport: MCPTransport.HTTP }]}
    >
      <DemoWrapper title="Message Thread Full">
        <div className="h-full relative flex flex-col rounded-lg overflow-hidden">
          <MessageThreadFull
            contextKey={userContextKey}
            className="w-full rounded-lg"
          />
        </div>
      </DemoWrapper>
    </TamboMcpProvider>
  );
}

export default function MessageThreadFullPage() {
  const installCommand = "npx tambo add message-thread-full";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Message Thread Full</h1>
          <p className="text-lg text-muted-foreground">
            A full message thread component with chat history and input field.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Installation</h2>
          <div className="rounded-md">
            <CLI command={installCommand} />
          </div>
        </div>

        <MessageThreadFullContent />
      </div>
    </div>
  );
}
