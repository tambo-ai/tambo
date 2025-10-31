"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { MCPTransport, TamboMcpProvider } from "@tambo-ai/react/mcp";

const MCP_DEMO_URL =
  process.env.NEXT_PUBLIC_MCP_DEMO_URL || "https://everything-mcp.tambo.co/mcp";

export default function MessageThreadFullPage() {
  const userContextKey = useUserContextKey("message-thread-full");

  return (
    <div className="prose max-w-full">
      {/* Title & Description */}
      <h1>Message Thread Full</h1>
      <p className="text-lg text-muted-foreground">
        A full-screen chat interface with message history, input field, and
        controls. Designed to take up the entire viewport, perfect for building
        conversational AI applications where chat is the primary interaction
        method.
      </p>

      {/* Examples Section */}
      <h2 className="mt-12">Examples</h2>

      <ComponentCodePreview
        title="Basic Usage"
        component={
          <TamboMcpProvider
            mcpServers={[{ url: MCP_DEMO_URL, transport: MCPTransport.HTTP }]}
          >
            <div className="w-full h-full relative flex flex-col rounded-lg overflow-hidden">
              <MessageThreadFull
                contextKey={userContextKey}
                className="w-full h-full rounded-lg"
              />
            </div>
          </TamboMcpProvider>
        }
        code={`import { MessageThreadFull } from "@tambo-ai/react";

export function ChatPage() {
  return (
    <div className="h-screen">
      <MessageThreadFull contextKey="main-chat" />
    </div>
  );
}`}
        previewClassName="p-0"
        minHeight={650}
        enableFullscreen
        fullscreenTitle="Message Thread Full"
      />

      {/* Installation */}
      <InstallationSection cliCommand="npx tambo add message-thread-full" />

      {/* Component API */}
      <h2 className="mt-12">Component API</h2>

      <h3>MessageThreadFull</h3>

      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>contextKey</td>
            <td>string</td>
            <td>-</td>
            <td>Unique identifier for the conversation thread</td>
          </tr>
          <tr>
            <td>className</td>
            <td>string</td>
            <td>-</td>
            <td>Additional CSS classes for customization</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
