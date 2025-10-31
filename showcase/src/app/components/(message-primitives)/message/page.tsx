"use client";

import { CLI } from "@/components/cli";
import {
  Message,
  MessageContent,
  MessageRenderedComponentArea,
  ReasoningInfo,
} from "@/components/ui/message";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";

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

  const assistantMessageWithReasoning = {
    id: "assistant-msg-3",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "I'll help you create a reusable button component. Let me think through the best approach for this.",
      },
    ],
    createdAt: new Date().toISOString(),
    threadId: "sample-thread",
    componentState: {},
    reasoningDurationMS: 8000,
    reasoning: [
      "The user is asking for help with a React component. I should consider what type of component would be most useful and educational. A button component is a great starting point because:\n\n1. It's commonly used in most applications\n2. It demonstrates key React concepts like props and styling\n3. It can show how to handle different variants and states\n4. It's simple enough to understand but flexible enough to be useful",
      "For the button component, I should include:\n- **Props interface**: Define clear prop types for variant, size, disabled state, etc.\n- **Styling system**: Use a flexible approach like CSS classes or styled-components\n- **Accessibility**: Include proper ARIA attributes and keyboard navigation\n- **Event handling**: Show how to handle click events properly\n\nI'll create a component that's both educational and production-ready.",
    ],
  };

  const assistantMessageThinking = {
    id: "assistant-msg-4",
    role: "assistant" as const,
    content: [],
    createdAt: new Date().toISOString(),
    threadId: "sample-thread",
    componentState: {},
    reasoning: [
      "Let me analyze this request step by step. The user wants help with a React component, so I should consider what would be most helpful...",
    ],
  };

  const usageCode = `import { Message, MessageContent, MessageRenderedComponentArea, ReasoningInfo } from "@/components/ui/message";

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

// With reasoning
<Message 
  role="assistant" 
  message={{ 
    id: "msg-2", 
    role: "assistant", 
    content: "Let me help you with that...", 
    reasoningDurationMS: 8000,
    reasoning: ["First, I need to understand...", "Then, I should consider..."],
    createdAt: "..." 
  }}
  variant="default"
>
  <ReasoningInfo />
  <MessageContent />
</Message>

// Thinking/Loading state with reasoning
<Message 
  role="assistant" 
  message={{ 
    id: "msg-3", 
    role: "assistant", 
    content: [], 
    reasoning: ["Analyzing the request..."],
    createdAt: "..." 
  }}
  isLoading={true}
>
  <ReasoningInfo />
  <MessageContent />
</Message>

// With custom content
<Message 
  role="assistant" 
  message={{ id: "msg-4", role: "assistant", content: "Hi there!", createdAt: "..." }}
  variant="solid"
>
  <MessageContent content="Custom message content" markdown={false} />
</Message>`;

  const installCommand = "npx tambo add message";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-4">Message</h1>
          <p className="text-lg text-muted-foreground mb-6">
            A primitive component for displaying individual messages in a
            conversation thread. Supports user and assistant roles with
            customizable styling variants.
          </p>
        </div>

        {/* Installation */}
        <div>
          <h2 className="text-xl font-500 mb-4">Installation</h2>
          <div className="rounded-md">
            <CLI command={installCommand} />
          </div>
          <p className="text-sm text-muted-foreground italic mt-2">
            Note: This component is automatically included when you install any
            of the &quot;Message Thread&quot; blocks.
          </p>
        </div>

        {/* Sub-components */}
        <div>
          <h2 className="text-xl font-500 mb-4">Sub-components</h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <ul className="space-y-3 text-sm">
              <li>
                <strong>
                  <code>&lt;MessageContent /&gt;</code> -
                </strong>{" "}
                Displays the actual message text content with optional markdown
                rendering. Handles loading states, tool call status, and content
                formatting. Supports custom content override and markdown
                toggle.
              </li>
              <li>
                <strong>
                  <code>&lt;MessageRenderedComponentArea /&gt;</code> -
                </strong>{" "}
                Renders interactive components returned by assistant messages.
                Shows a &quot;View in canvas&quot; button if a canvas space
                exists, otherwise renders the component inline. Only appears for
                assistant messages with rendered components.
              </li>
              <li>
                <strong>
                  <code>&lt;ReasoningInfo /&gt;</code> -
                </strong>{" "}
                Displays reasoning information in a collapsible dropdown. Shows
                the reasoning steps provided by the LLM when available.
                Auto-collapses when message content arrives. Shows animated
                &quot;Thinking&quot; text when in loading state.
              </li>
            </ul>
          </div>
        </div>

        {/* Sample Code */}
        <div>
          <h2 className="text-xl font-500 mb-4">Usage</h2>
          <SyntaxHighlighter code={usageCode} language="tsx" />
        </div>

        {/* User Message Example */}
        <div>
          <h3 className="text-lg font-medium mb-3">User Message</h3>
          <div className="p-4 border rounded-lg bg-card">
            <Message
              role="user"
              message={userMessage}
              variant="default"
              className="justify-end"
            >
              <div className="max-w-3xl">
                <MessageContent className="text-foreground bg-container hover:bg-backdrop font-sans" />
              </div>
            </Message>
          </div>
        </div>

        {/* Assistant Message Example */}
        <div>
          <h3 className="text-lg font-medium mb-3">Assistant Message</h3>
          <div className="p-4 border rounded-lg bg-card">
            <Message
              role="assistant"
              message={assistantMessage}
              variant="default"
              className="justify-start"
            >
              <div className="w-full">
                <MessageContent className="text-foreground font-sans" />
              </div>
            </Message>
          </div>
        </div>

        {/* Assistant Message with Reasoning */}
        <div>
          <h3 className="text-lg font-medium mb-3">
            Assistant Message with Reasoning
          </h3>
          <div className="p-4 border rounded-lg bg-card">
            <Message
              role="assistant"
              message={assistantMessageWithReasoning}
              variant="default"
              className="justify-start"
            >
              <div className="w-full">
                <ReasoningInfo />
                <MessageContent className="text-foreground font-sans" />
              </div>
            </Message>
          </div>
        </div>

        {/* Assistant Message with Component */}
        <div>
          <h3 className="text-lg font-medium mb-3">
            Assistant Message with Rendered Component
          </h3>
          <div className="p-4 border rounded-lg bg-card">
            <Message
              role="assistant"
              message={assistantMessageWithComponent}
              variant="default"
              className="justify-start"
            >
              <div className="w-full">
                <MessageContent className="text-foreground font-sans" />
                <MessageRenderedComponentArea className="w-full" />
              </div>
            </Message>
          </div>
        </div>

        {/* Solid Variant Example */}
        <div>
          <h3 className="text-lg font-medium mb-3">Solid Variant</h3>
          <div className="p-4 border rounded-lg bg-card">
            <Message
              role="assistant"
              message={assistantMessage}
              variant="solid"
              className="justify-start"
            >
              <div className="w-full">
                <MessageContent className="text-foreground font-sans" />
              </div>
            </Message>
          </div>
        </div>

        {/* Loading State Example */}
        <div>
          <h3 className="text-lg font-medium mb-3">Loading State</h3>
          <div className="p-4 border rounded-lg bg-card">
            <Message
              role="assistant"
              message={{ ...assistantMessage, content: [] }}
              variant="default"
              isLoading={true}
              className="justify-start"
            >
              <div className="w-full">
                <MessageContent className="text-foreground font-sans" />
              </div>
            </Message>
          </div>
        </div>

        {/* Thinking/Loading State Example */}
        <div>
          <h3 className="text-lg font-medium mb-3">Thinking/Loading State</h3>
          <div className="p-4 border rounded-lg bg-card">
            <Message
              role="assistant"
              message={assistantMessageThinking}
              variant="default"
              isLoading={true}
              className="justify-start"
            >
              <div className="w-full">
                <ReasoningInfo />
                <MessageContent className="text-foreground font-sans" />
              </div>
            </Message>
          </div>
        </div>

        {/* Props Documentation */}
        <div>
          <h2 className="text-xl font-500 mb-4">Props</h2>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 w-32">Prop</th>
                  <th className="text-left py-2 w-48">Type</th>
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
                    The full Tambo thread message object. Can include optional
                    <code className="bg-muted px-1 rounded text-xs ml-1">
                      reasoning
                    </code>
                    field (string[]) for displaying AI reasoning steps.
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
                    state. Enables thinking animation in ReasoningInfo
                    component.
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
    </div>
  );
}
