"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { MessageThreadCollapsible } from "@/components/ui/message-thread-collapsible";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { MCPTransport, TamboMcpProvider } from "@tambo-ai/react/mcp";

const MCP_DEMO_URL =
  process.env.NEXT_PUBLIC_MCP_DEMO_URL || "https://everything-mcp.tambo.co/mcp";

export default function MessageThreadCollapsiblePage() {
  const userContextKey = useUserContextKey("message-thread-collapsible");

  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message Thread Collapsible
        </h1>
        <p className="text-lg text-muted-foreground">
          A collapsible message thread component that can be positioned anywhere
          on your page. Features chat history, input field, and expand/collapse
          functionality. Perfect for adding contextual AI assistance without
          taking up permanent screen space.
        </p>
      </header>

      {/* Examples Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Basic Usage"
            component={
              <TamboMcpProvider
                mcpServers={[
                  {
                    url: MCP_DEMO_URL,
                    transport: MCPTransport.HTTP,
                    handlers: {
                      elicitation: async (request) => {
                        console.log("elicitation request", request);
                        return {
                          action: "accept",
                          content: {
                            type: "text",
                            text: "Hello, world!",
                          },
                        };
                      },
                    },
                  },
                ]}
              >
                <div className="w-full flex-1 bg-muted/20 flex flex-col gap-4 p-6 h-full relative">
                  <div className="h-8 w-[200px] bg-muted/80 rounded-md" />
                  <div className="h-4 w-[300px] bg-muted/80 rounded-md" />
                  <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="h-32 bg-muted/80 rounded-lg" />
                    <div className="h-32 bg-muted/80 rounded-lg" />
                    <div className="h-32 bg-muted/80 rounded-lg" />
                  </div>
                  <div className="mt-4 h-4 w-[280px] bg-muted/80 rounded-md" />
                  <div className="h-4 w-[320px] bg-muted/80 rounded-md" />
                  <div className="flex-grow" />
                  <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
                  <div className="h-4 w-[200px] bg-muted/80 rounded-md" />
                  <MessageThreadCollapsible
                    defaultOpen={false}
                    contextKey={userContextKey}
                    className="absolute bottom-6 right-4"
                  />
                </div>
              </TamboMcpProvider>
            }
            code={`import { MessageThreadCollapsible } from "@tambo-ai/react";

export function PageWithChat() {
  return (
    <div className="relative min-h-screen p-6">
      {/* Your page content */}
      <h1>Your Dashboard</h1>
      <p>Main content goes here...</p>

      {/* Collapsible chat positioned in bottom-right */}
      <MessageThreadCollapsible
        contextKey="help-chat"
        defaultOpen={false}
        className="absolute bottom-6 right-4"
      />
    </div>
  );
}`}
            previewClassName="p-0"
            fullBleed
            minHeight={650}
            enableFullscreen
            fullscreenTitle="Message Thread Collapsible"
          />
        </div>
      </section>

      {/* Installation */}
      <section>
        <InstallationSection cliCommand="npx tambo add message-thread-collapsible" />
      </section>

      {/* Component API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">MessageThreadCollapsible</h3>

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
                <td>defaultOpen</td>
                <td>boolean</td>
                <td>false</td>
                <td>Whether the thread starts expanded or collapsed</td>
              </tr>
              <tr>
                <td>className</td>
                <td>string</td>
                <td>-</td>
                <td>Additional CSS classes for positioning and styling</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
