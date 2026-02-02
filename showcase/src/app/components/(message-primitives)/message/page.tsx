"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import {
  Message,
  MessageContent,
  MessageRenderedComponentArea,
  ReasoningInfo,
} from "@tambo-ai/ui-registry/components/message";

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
      <div className="p-4 bg-muted rounded-lg border border-border">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
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

  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message
        </h1>
        <p className="text-lg text-muted-foreground">
          A primitive component for displaying individual messages in a
          conversation thread. Supports user and assistant roles with
          customizable styling variants.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>
        <div className="space-y-6">
          <ComponentCodePreview
            title="User Message"
            component={
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
            }
            code={`import { Message, MessageContent } from "@/components/tambo/message";

export function UserMessage() {
  return (
    <Message
      role="user"
      message={message}
      variant="default"
      className="justify-end"
    >
      <div className="max-w-3xl">
        <MessageContent className="text-foreground bg-container hover:bg-backdrop" />
      </div>
    </Message>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant Message"
            component={
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
            }
            code={`import { Message, MessageContent } from "@/components/tambo/message";

export function AssistantMessage() {
  return (
    <Message
      role="assistant"
      message={message}
      variant="default"
      className="justify-start"
    >
      <div className="w-full">
        <MessageContent className="text-foreground font-sans" />
      </div>
    </Message>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant Message with Reasoning"
            component={
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
            }
            code={`import {
  Message,
  MessageContent,
  ReasoningInfo,
} from "@/components/tambo/message";

export function MessageWithReasoning() {
  return (
    <Message role="assistant" message={message} variant="default">
      <div className="w-full">
        <ReasoningInfo />
        <MessageContent className="text-foreground font-sans" />
      </div>
    </Message>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant Message with Rendered Component"
            component={
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
            }
            code={`import {
  Message,
  MessageContent,
  MessageRenderedComponentArea,
} from "@/components/tambo/message";

export function MessageWithComponent() {
  return (
    <Message role="assistant" message={message} variant="default">
      <div className="w-full">
        <MessageContent className="text-foreground font-sans" />
        <MessageRenderedComponentArea className="w-full" />
      </div>
    </Message>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Solid Variant"
            component={
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
            }
            code={`import { Message, MessageContent } from "@/components/tambo/message";

export function SolidMessage() {
  return (
    <Message role="assistant" message={message} variant="solid">
      <div className="w-full">
        <MessageContent className="text-foreground font-sans" />
      </div>
    </Message>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Loading State"
            component={
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
            }
            code={`import { Message, MessageContent } from "@/components/tambo/message";

export function LoadingMessage() {
  return (
    <Message
      role="assistant"
      message={message}
      isLoading={true}
      variant="default"
    >
      <div className="w-full">
        <MessageContent className="text-foreground font-sans" />
      </div>
    </Message>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Thinking/Loading State with Reasoning"
            component={
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
            }
            code={`import {
  Message,
  MessageContent,
  ReasoningInfo,
} from "@/components/tambo/message";

export function ThinkingMessage() {
  return (
    <Message role="assistant" message={message} isLoading={true}>
      <div className="w-full">
        <ReasoningInfo />
        <MessageContent className="text-foreground font-sans" />
      </div>
    </Message>
  );
}`}
            previewClassName="p-4"
          />
        </div>
      </section>

      <section>
        <InstallationSection cliCommand="npx tambo add message" />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Message</h3>

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
                  <td>role</td>
                  <td>&quot;user&quot; | &quot;assistant&quot;</td>
                  <td>-</td>
                  <td>The role of the message sender</td>
                </tr>
                <tr>
                  <td>message</td>
                  <td>TamboThreadMessage</td>
                  <td>-</td>
                  <td>
                    The full Tambo thread message object. Can include optional{" "}
                    <code>reasoning</code> field (string[]) for displaying AI
                    reasoning steps.
                  </td>
                </tr>
                <tr>
                  <td>variant</td>
                  <td>&quot;default&quot; | &quot;solid&quot;</td>
                  <td>&quot;default&quot;</td>
                  <td>Optional styling variant for the message container</td>
                </tr>
                <tr>
                  <td>isLoading</td>
                  <td>boolean</td>
                  <td>false</td>
                  <td>
                    Optional flag to indicate if the message is in a loading
                    state. Enables thinking animation in ReasoningInfo
                    component.
                  </td>
                </tr>
                <tr>
                  <td>children</td>
                  <td>React.ReactNode</td>
                  <td>-</td>
                  <td>
                    The child elements to render within the root container
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Sub-components</h3>

            <ul>
              <li>
                <strong>MessageContent</strong> - Displays the actual message
                text content with optional markdown rendering. Handles loading
                states, tool call status, and content formatting. Supports
                custom content override and markdown toggle.
              </li>
              <li>
                <strong>MessageRenderedComponentArea</strong> - Renders
                interactive components returned by assistant messages. Shows a
                &quot;View in canvas&quot; button if a canvas space exists,
                otherwise renders the component inline. Only appears for
                assistant messages with rendered components.
              </li>
              <li>
                <strong>ReasoningInfo</strong> - Displays reasoning information
                in a collapsible dropdown. Shows the reasoning steps provided by
                the LLM when available. Auto-collapses when message content
                arrives. Shows animated &quot;Thinking&quot; text when in
                loading state.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
