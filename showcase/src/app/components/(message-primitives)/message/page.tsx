"use client";

import {
  Message,
  MessageContent,
  MessageRenderedComponentArea,
} from "@/components/ui/message";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";

export default function MessagePage() {
  // Sample message data for examples
  const userMessage = {
    id: "user-msg-1",
    role: "user" as const,
    content: [
      {
        type: "text" as const,
        text: "Hello! Can you help me with a React component?",
      },
    ],
    createdAt: new Date().toISOString(),
    threadId: "sample-thread",
    componentState: {},
  };

  const assistantMessage = {
    id: "assistant-msg-1",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "Of course! I'd be happy to help you with your React component. What specifically would you like to know?",
      },
    ],
    createdAt: new Date().toISOString(),
    threadId: "sample-thread",
    componentState: {},
  };

  const assistantMessageWithComponent = {
    id: "assistant-msg-2",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "Here's a simple button component for you:",
      },
    ],
    createdAt: new Date().toISOString(),
    threadId: "sample-thread",
    componentState: {},
    renderedComponent: (
      <div className="p-4 bg-gray-50 rounded-lg border">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Click me!
        </button>
      </div>
    ),
  };

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Message</h1>
            <p className="text-lg text-secondary mb-6">
              A primitive component for displaying individual messages in a
              conversation thread. Supports user and assistant roles with
              customizable styling variants.
            </p>
          </div>

          {/* Sample Code */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Usage</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <pre className="text-sm overflow-x-auto">
                <code>{`import { Message, MessageContent, MessageRenderedComponentArea } from "@/components/ui/message";

// Basic usage
<Message 
  role="user" 
  message={{ id: "msg-1", role: "user", content: "Hello!", createdAt: "..." }}
  variant="default"
  isLoading={false}
>
  <MessageContent />
  <MessageRenderedComponentArea />
</Message>

// With custom content
<Message 
  role="assistant" 
  message={{ id: "msg-2", role: "assistant", content: "Hi there!", createdAt: "..." }}
  variant="solid"
>
  <MessageContent content="Custom message content" markdown={false} />
</Message>`}</code>
              </pre>
            </div>
          </div>

          {/* User Message Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">User Message</h3>
            <div className="p-4 border rounded-lg bg-white">
              <Message
                role="user"
                message={userMessage}
                variant="default"
                className="justify-end"
              >
                <div className="max-w-3xl">
                  <MessageContent className="text-primary bg-container hover:bg-backdrop font-sans" />
                </div>
              </Message>
            </div>
          </div>

          {/* Assistant Message Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Assistant Message</h3>
            <div className="p-4 border rounded-lg bg-white">
              <Message
                role="assistant"
                message={assistantMessage}
                variant="default"
                className="justify-start"
              >
                <div className="w-full">
                  <MessageContent className="text-primary font-sans" />
                </div>
              </Message>
            </div>
          </div>

          {/* Assistant Message with Component */}
          <div>
            <h3 className="text-lg font-medium mb-3">
              Assistant Message with Rendered Component
            </h3>
            <div className="p-4 border rounded-lg bg-white">
              <Message
                role="assistant"
                message={assistantMessageWithComponent}
                variant="default"
                className="justify-start"
              >
                <div className="w-full">
                  <MessageContent className="text-primary font-sans" />
                  <MessageRenderedComponentArea className="w-full" />
                </div>
              </Message>
            </div>
          </div>

          {/* Solid Variant Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Solid Variant</h3>
            <div className="p-4 border rounded-lg bg-white">
              <Message
                role="assistant"
                message={assistantMessage}
                variant="solid"
                className="justify-start"
              >
                <div className="w-full">
                  <MessageContent className="text-primary font-sans" />
                </div>
              </Message>
            </div>
          </div>

          {/* Loading State Example */}
          <div>
            <h3 className="text-lg font-medium mb-3">Loading State</h3>
            <div className="p-4 border rounded-lg bg-white">
              <Message
                role="assistant"
                message={{ ...assistantMessage, content: [] }}
                variant="default"
                isLoading={true}
                className="justify-start"
              >
                <div className="w-full">
                  <MessageContent className="text-primary font-sans" />
                </div>
              </Message>
            </div>
          </div>

          {/* Props Documentation */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Props</h2>
            <div className="bg-gray-50 rounded-lg p-4">
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
                    <td className="py-2 font-mono">role</td>
                    <td className="py-2">
                      &quot;user&quot; | &quot;assistant&quot;
                    </td>
                    <td className="py-2">The role of the message sender</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">message</td>
                    <td className="py-2">TamboThreadMessage</td>
                    <td className="py-2">
                      The full Tambo thread message object
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">variant</td>
                    <td className="py-2">
                      &quot;default&quot; | &quot;solid&quot;
                    </td>
                    <td className="py-2">
                      Optional styling variant for the message container
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">isLoading</td>
                    <td className="py-2">boolean</td>
                    <td className="py-2">
                      Optional flag to indicate if the message is in a loading
                      state
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">children</td>
                    <td className="py-2">React.ReactNode</td>
                    <td className="py-2">
                      The child elements to render within the root container
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
