"use client";

import { CLI } from "@/components/cli";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
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
export default function ThreadContentPage() {
  const usageCode = `import { ThreadContent, ThreadContentMessages } from "@/components/ui/thread-content";

// Basic usage
<ThreadContent variant="default">
  <ThreadContentMessages />
</ThreadContent>

// With solid variant
<ThreadContent variant="solid">
  <ThreadContentMessages className="custom-messages-styling" />
</ThreadContent>

// Custom wrapper
<ThreadContent>
  <div className="custom-wrapper">
    <ThreadContentMessages />
  </div>
</ThreadContent>`;

  const installCommand = "npx tambo add thread-content";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Thread Content</h1>
            <p className="text-lg text-secondary mb-6">
              A primitive component that displays the main content area of a
              conversation thread. Automatically connects to the Tambo context
              to render messages with customizable styling variants.
            </p>
          </div>

          {/* Installation */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
            <p className="text-sm text-muted-foreground italic mt-2">
              Note: This component is automatically included when you install
              any of the &quot;Message Thread&quot; blocks.
            </p>
          </div>

          {/* Sub-components */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Sub-components</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <ul className="space-y-3 text-sm">
                <li>
                  <strong>
                    <code>&lt;ThreadContentMessages /&gt;</code> -
                  </strong>{" "}
                  Renders the list of messages in the thread. Automatically
                  connects to the Tambo context to display messages with proper
                  alignment based on sender role. Handles loading indicators for
                  messages being generated and supports rendered components
                  within assistant messages.
                </li>
              </ul>
            </div>
          </div>

          {/* Sample Code */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Usage</h2>
            <SyntaxHighlighter code={usageCode} language="tsx" />
          </div>

          {/* Default Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Default Thread Content</h3>
            <div className="p-4 border rounded-lg bg-white">
              <TamboStubProvider thread={mockThread}>
                <ThreadContent variant="default">
                  <ThreadContentMessages />
                </ThreadContent>
              </TamboStubProvider>
            </div>
          </div>
          {/* Solid Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Solid Variant</h3>
            <div className="p-4 border rounded-lg bg-white">
              <TamboStubProvider thread={mockThread}>
                <ThreadContent variant="solid">
                  <ThreadContentMessages />
                </ThreadContent>
              </TamboStubProvider>
            </div>
          </div>

          {/* Empty State Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Empty Thread (No Messages)
            </h3>
            <div className="p-4 h-48 border rounded-lg bg-white flex items-center justify-center">
              <TamboStubProvider
                thread={{
                  messages: [],
                  createdAt: new Date().toISOString(),
                  projectId: "1",
                  updatedAt: new Date().toISOString(),
                  id: "1",
                }}
              >
                <ThreadContent>
                  <ThreadContentMessages />
                </ThreadContent>
              </TamboStubProvider>
            </div>
          </div>

          {/* Props Documentation */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Props</h2>

            <h3 className="text-lg font-medium mb-3">ThreadContent</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Prop</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-mono">variant</td>
                    <td className="py-2">
                      &quot;default&quot; | &quot;solid&quot;
                    </td>
                    <td className="py-2">
                      Optional styling variant for the message container
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">children</td>
                    <td className="py-2">React.ReactNode</td>
                    <td className="py-2">
                      The child elements to render within the container
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium mb-3">
              ThreadContentMessages Props
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Prop</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 font-mono">className</td>
                    <td className="py-2">string</td>
                    <td className="py-2">
                      Optional CSS classes to apply to the messages container
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium mb-3">Features</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-sm">
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
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
