"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";

export default function MessageThreadFullPage() {
  const exampleSuggestions = [
    {
      id: "full-suggestion-1",
      title: "Summarize notes",
      detailedSuggestion:
        "Summarize my release notes into concise bullet points.",
      messageId: "full-summarize-notes",
    },
    {
      id: "full-suggestion-2",
      title: "Draft email",
      detailedSuggestion: "Draft a follow-up email based on this conversation.",
      messageId: "full-draft-email",
    },
    {
      id: "full-suggestion-3",
      title: "Create tasks",
      detailedSuggestion: "Turn the discussion into a prioritized task list.",
      messageId: "full-create-tasks",
    },
  ];

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
              <MessageThreadFull
                className="w-full h-full"
                initialSuggestions={exampleSuggestions}
              />
            }
            code={`import { MessageThreadFull } from "@/components/tambo/message-thread-full";

export function ChatPage() {
  const exampleSuggestions = [
    {
      id: "suggestion-1",
      title: "Summarize notes",
      detailedSuggestion: "Summarize this chat into key decisions.",
      messageId: "summary-query",
    },
  ];

  return (
    <div className="h-screen">
      <MessageThreadFull initialSuggestions={exampleSuggestions} />
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
                <td>variant</td>
                <td>
                  &quot;default&quot; | &quot;compact&quot; | &quot;solid&quot;
                </td>
                <td>&quot;default&quot;</td>
                <td>Visual style variant for messages in the thread</td>
              </tr>
              <tr>
                <td>className</td>
                <td>string</td>
                <td>-</td>
                <td>Additional CSS classes for customization</td>
              </tr>
              <tr>
                <td>initialSuggestions</td>
                <td>Suggestion[]</td>
                <td>-</td>
                <td>
                  Optional caller-provided starter suggestions shown before a
                  conversation begins
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
