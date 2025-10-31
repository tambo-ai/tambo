"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { MessageThreadPanel } from "@/components/ui/message-thread-panel";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { MCPTransport, TamboMcpProvider } from "@tambo-ai/react/mcp";

const MCP_DEMO_URL =
  process.env.NEXT_PUBLIC_MCP_DEMO_URL || "https://everything-mcp.tambo.co/mcp";

export default function MessageThreadPanelPage() {
  const userContextKey = useUserContextKey("message-thread-panel");

  return (
    <div className="prose max-w-full">
      {/* Title & Description */}
      <h1>Message Thread Panel</h1>
      <p className="text-lg text-muted-foreground">
        A sidebar-style message thread component with chat history and input
        field. Perfect for split-screen layouts where you want to show both your
        main content and a chat interface side-by-side. Can be positioned on
        either side of your layout.
      </p>

      {/* Examples Section */}
      <h2 className="mt-12">Examples</h2>

      <ComponentCodePreview
        title="Basic Usage"
        component={
          <TamboMcpProvider
            mcpServers={[{ url: MCP_DEMO_URL, transport: MCPTransport.HTTP }]}
          >
            <div className="w-full h-full relative flex rounded-lg overflow-hidden">
              <div className="flex-1 bg-muted/20 flex flex-col gap-4 p-6 min-w-0">
                <div className="h-8 w-[200px] bg-muted/80 rounded-md" />
                <div className="h-4 w-[300px] bg-muted/80 rounded-md" />
                <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="h-32 bg-muted/80 rounded-lg" />
                  <div className="h-32 bg-muted/80 rounded-lg" />
                </div>
              </div>
              <MessageThreadPanel
                contextKey={userContextKey}
                className="right rounded-r-lg"
                style={{ height: "100%", width: "60%" }}
              />
            </div>
          </TamboMcpProvider>
        }
        code={`import { MessageThreadPanel } from "@tambo-ai/react";

export function DashboardWithChat() {
  return (
    <div className="flex h-screen">
      {/* Main content area */}
      <div className="flex-1 p-6">
        <h1>Dashboard</h1>
        <p>Your main content goes here...</p>
      </div>

      {/* Chat panel on the right */}
      <MessageThreadPanel
        contextKey="dashboard-assistant"
        className="right"
        style={{ width: "400px" }}
      />
    </div>
  );
}`}
        previewClassName="p-0"
        minHeight={650}
        enableFullscreen
        fullscreenTitle="Message Thread Panel"
      />

      {/* Installation */}
      <InstallationSection cliCommand="npx tambo add message-thread-panel" />

      {/* Component API */}
      <h2 className="mt-12">Component API</h2>

      <h3>MessageThreadPanel</h3>

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
            <td>
              Additional CSS classes, typically includes position (left/right)
            </td>
          </tr>
          <tr>
            <td>style</td>
            <td>CSSProperties</td>
            <td>-</td>
            <td>Inline styles for customizing width, height, etc.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
