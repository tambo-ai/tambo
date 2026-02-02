"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";

export default function MessageThreadFullPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message Thread Full
        </h1>
        <p className="text-lg text-muted-foreground">
          A full-screen chat interface with message history, input field, and
          controls. Designed to take up the entire viewport, perfect for
          building conversational AI applications where chat is the primary
          interaction method.
        </p>
      </header>

      {/* Examples Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Basic Usage"
            component={
              <div className="w-full h-full relative flex flex-col rounded-lg overflow-hidden">
                <MessageThreadFull className="w-full h-full rounded-lg" />
              </div>
            }
            code={`import { MessageThreadFull } from "@/components/tambo/message-thread-full";

export function ChatPage() {
  return (
    <div className="h-screen">
      <MessageThreadFull contextKey="main-chat" />
    </div>
  );
}`}
            previewClassName="p-0"
            fullBleed
            minHeight={650}
            enableFullscreen
            fullscreenTitle="Message Thread Full"
          />
        </div>
      </section>

      {/* Installation */}
      <section>
        <InstallationSection cliCommand="npx tambo add message-thread-full" />
      </section>

      {/* Component API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">MessageThreadFull</h3>

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
      </section>
    </div>
  );
}
