"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { MessageThreadPanelWithMcp } from "@/components/generative/MessageThreadPanelWithMcp";
import { InstallationSection } from "@/components/installation-section";

export default function MessageThreadPanelPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message Thread Panel
        </h1>
        <p className="text-lg text-muted-foreground">
          A sidebar-style message thread component with chat history and input
          field. Perfect for split-screen layouts where you want to show both
          your main content and a chat interface side-by-side. Can be positioned
          on either side of your layout.
        </p>
      </header>

      {/* Examples Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Basic Usage"
            component={
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
                <MessageThreadPanelWithMcp
                  className="right rounded-r-lg"
                  style={{ height: "100%", width: "60%" }}
                />
              </div>
            }
            code={`import { MessageThreadPanel } from "@/components/tambo/message-thread-panel";

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
            fullBleed
            minHeight={650}
            enableFullscreen
            fullscreenTitle="Message Thread Panel"
          />
        </div>
      </section>

      {/* Installation */}
      <section>
        <InstallationSection cliCommand="npx tambo add message-thread-panel" />
      </section>

      {/* Component API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">MessageThreadPanel</h3>

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
                  Additional CSS classes, typically includes position
                  (left/right)
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
      </section>
    </div>
  );
}
