"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";
import { TamboStubProvider, TamboThread } from "@tambo-ai/react";

const mockThread: TamboThread = {
  id: "1",
  name: "Mock Thread",
  messages: [
    {
      id: "msg-1",
      role: "user",
      threadId: "1",
      createdAt: new Date().toISOString(),
      componentState: {},
      content: [{ type: "text", text: "What's the weather?" }],
    },
    {
      id: "msg-2",
      role: "assistant",
      threadId: "1",
      createdAt: new Date().toISOString(),
      componentState: {},
      content: [
        {
          type: "text",
          text: "Hello, world! I'm an assistant. I'll get the weather for you",
        },
      ],
      actionType: "tool_call",
      toolCallRequest: {
        toolName: "get_weather",
        parameters: [
          {
            parameterName: "city",
            parameterValue: "San Francisco",
          },
        ],
      },
    },
    {
      id: "msg-3",
      role: "assistant",
      threadId: "1",
      createdAt: new Date().toISOString(),
      componentState: {},
      content: [
        { type: "text", text: "The weather in San Francisco is sunny." },
      ],
      renderedComponent: (
        <div>
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
            <div className="text-yellow-400 text-2xl">☀️</div>
            <div>
              <div className="font-medium">San Francisco</div>
              <div className="text-sm text-gray-600">Sunny</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "msg-4",
      role: "user",
      threadId: "1",
      createdAt: new Date().toISOString(),
      componentState: {},
      content: [{ type: "text", text: "Thanks" }],
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  projectId: "1",
};

const emptyThread: TamboThread = {
  id: "2",
  messages: [],
  createdAt: new Date().toISOString(),
  projectId: "1",
  updatedAt: new Date().toISOString(),
};

export default function ThreadContentPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Thread Content
        </h1>
        <p className="text-lg text-muted-foreground">
          A primitive component that displays the main content area of a
          conversation thread. Automatically connects to the Tambo context to
          render messages with customizable styling variants.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Default Variant"
            component={
              <TamboStubProvider thread={mockThread}>
                <ThreadContent variant="default">
                  <ThreadContentMessages />
                </ThreadContent>
              </TamboStubProvider>
            }
            code={`import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";

export function ChatDemo() {
  return (
    <ThreadContent variant="default">
      <ThreadContentMessages />
    </ThreadContent>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Solid Variant"
            component={
              <TamboStubProvider thread={mockThread}>
                <ThreadContent variant="solid">
                  <ThreadContentMessages />
                </ThreadContent>
              </TamboStubProvider>
            }
            code={`import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";

export function ChatDemo() {
  return (
    <ThreadContent variant="solid">
      <ThreadContentMessages className="custom-messages-styling" />
    </ThreadContent>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Empty Thread (No Messages)"
            component={
              <TamboStubProvider thread={emptyThread}>
                <ThreadContent>
                  <ThreadContentMessages />
                </ThreadContent>
              </TamboStubProvider>
            }
            code={`import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";

export function EmptyThread() {
  return (
    <ThreadContent>
      <ThreadContentMessages />
    </ThreadContent>
  );
}`}
            previewClassName="p-4"
            minHeight={200}
          />
        </div>
      </section>

      <section>
        <InstallationSection cliCommand="npx tambo add thread-content" />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">ThreadContent</h3>

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
                  <td>&quot;default&quot; | &quot;solid&quot;</td>
                  <td>&quot;default&quot;</td>
                  <td>Optional styling variant for the message container</td>
                </tr>
                <tr>
                  <td>children</td>
                  <td>React.ReactNode</td>
                  <td>-</td>
                  <td>The child elements to render within the container</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">ThreadContentMessages</h3>

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
                  <td>className</td>
                  <td>string</td>
                  <td>-</td>
                  <td>
                    Optional CSS classes to apply to the messages container
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Features</h3>

            <ul>
              <li>
                <strong>Automatic Context Integration:</strong> Connects to
                Tambo thread context to display messages
              </li>
              <li>
                <strong>Loading State Handling:</strong> Shows loading
                indicators for messages being generated
              </li>
              <li>
                <strong>Message Variants:</strong> Applies consistent styling
                variants to all messages
              </li>
              <li>
                <strong>Responsive Layout:</strong> Handles message alignment
                based on sender role
              </li>
              <li>
                <strong>Component Rendering:</strong> Supports rendered
                components within assistant messages
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
