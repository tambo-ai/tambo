"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import {
  Message as AIElementsMessage,
  MessageContent as AIElementsMessageContent,
  MessageResponse as AIElementsMessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Message,
  MessageContent,
  ReasoningInfo,
} from "@tambo-ai/ui-registry/components/message";
import {
  useExternalStoreRuntime,
  AssistantRuntimeProvider,
  ThreadPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { useState, type ReactNode } from "react";
import {
  mockMessages,
  isTextContent,
  type MockMessage,
} from "../__fixtures__/mock-messages";

// Local re-definition of mock messages for Tambo components
// (Avoids readonly type issues with TamboThreadMessage)
const tamboMessages = {
  user: {
    id: "user-1",
    role: "user" as const,
    content: [
      {
        type: "text" as const,
        text: "Hello! Can you help me with a React component?",
      },
    ],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },
  assistant: {
    id: "assistant-1",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "Of course! I'd be happy to help you build a React component. What would you like to create?",
      },
    ],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },
  withReasoning: {
    id: "assistant-2",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "Let me create a button component for you.",
      },
    ],
    reasoning: [
      "The user is asking for help with a React component. I should consider what type would be most useful and educational.",
      "A button component is a great starting point - it demonstrates props, styling, event handling, and TypeScript patterns.",
    ],
    reasoningDurationMS: 5000,
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },
};

// ============================================================================
// Tambo Implementation
// ============================================================================

function TamboUserMessage() {
  return (
    <Message
      role="user"
      message={tamboMessages.user}
      variant="default"
      className="justify-end"
    >
      <div className="max-w-3xl">
        <MessageContent className="text-foreground bg-container hover:bg-backdrop font-sans" />
      </div>
    </Message>
  );
}

function _TamboAssistantMessage() {
  return (
    <Message
      role="assistant"
      message={tamboMessages.assistant}
      variant="default"
      className="justify-start"
    >
      <div className="w-full">
        <MessageContent className="text-foreground font-sans" />
      </div>
    </Message>
  );
}

function TamboMessageWithReasoning() {
  return (
    <Message
      role="assistant"
      message={tamboMessages.withReasoning}
      variant="default"
      className="justify-start"
    >
      <div className="w-full">
        <ReasoningInfo />
        <MessageContent className="text-foreground font-sans" />
      </div>
    </Message>
  );
}

// ============================================================================
// AI Elements Implementation
// ============================================================================

function AIElementsUserMessage() {
  const textContent = mockMessages.user.content
    .filter(isTextContent)
    .map((part) => part.text)
    .join(" ");

  return (
    <AIElementsMessage from="user">
      <AIElementsMessageContent>
        <AIElementsMessageResponse>{textContent}</AIElementsMessageResponse>
      </AIElementsMessageContent>
    </AIElementsMessage>
  );
}

function _AIElementsAssistantMessage() {
  const textContent = mockMessages.assistant.content
    .filter(isTextContent)
    .map((part) => part.text)
    .join(" ");

  return (
    <AIElementsMessage from="assistant">
      <AIElementsMessageContent>
        <AIElementsMessageResponse>{textContent}</AIElementsMessageResponse>
      </AIElementsMessageContent>
    </AIElementsMessage>
  );
}

function AIElementsMessageWithReasoning() {
  const message = mockMessages.withReasoning;
  const textContent = message.content
    .filter(isTextContent)
    .map((part) => part.text)
    .join(" ");

  return (
    <AIElementsMessage from="assistant">
      {message.reasoning && (
        <Reasoning isStreaming={false} defaultOpen={true}>
          <ReasoningTrigger
            getThinkingMessage={(streaming, duration) =>
              streaming ? "Thinking..." : `Thought for ${duration}s`
            }
          />
          <ReasoningContent>
            {message.reasoning.map((step, i) => (
              <div key={i} className="mb-2 last:mb-0">
                {step}
              </div>
            ))}
          </ReasoningContent>
        </Reasoning>
      )}
      <AIElementsMessageContent>
        <AIElementsMessageResponse>{textContent}</AIElementsMessageResponse>
      </AIElementsMessageContent>
    </AIElementsMessage>
  );
}

// ============================================================================
// Assistant UI Implementation
// ============================================================================

function convertToThreadMessage(msg: MockMessage): ThreadMessageLike {
  const base = {
    id: msg.id,
    role: msg.role,
    content: msg.content.map((part) => {
      if (part.type === "text") {
        return { type: "text" as const, text: part.text };
      }
      return { type: "text" as const, text: "" };
    }),
    createdAt: new Date(msg.createdAt),
  };

  // Status is only supported for assistant messages
  if (msg.role === "assistant") {
    return {
      ...base,
      status: { type: "complete" as const, reason: "stop" as const },
    };
  }

  return base;
}

function StaticAssistantProvider({ children }: { children: ReactNode }) {
  const [messages] = useState<ThreadMessageLike[]>([
    convertToThreadMessage(mockMessages.user),
    convertToThreadMessage(mockMessages.assistant),
  ]);

  const runtime = useExternalStoreRuntime({
    isRunning: false,
    messages,
    convertMessage: (msg) => msg,
    onNew: async () => {},
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

function AssistantUIUserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end mb-4">
      <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => <p>{text}</p>,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantUIAssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start mb-4">
      <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => <div className="prose prose-sm">{text}</div>,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantUIThread() {
  return (
    <StaticAssistantProvider>
      <ThreadPrimitive.Root className="flex flex-col">
        <ThreadPrimitive.Viewport className="flex-1 p-4">
          <ThreadPrimitive.Messages
            components={{
              UserMessage: AssistantUIUserMessage,
              AssistantMessage: AssistantUIAssistantMessage,
            }}
          />
        </ThreadPrimitive.Viewport>
      </ThreadPrimitive.Root>
    </StaticAssistantProvider>
  );
}

// ============================================================================
// Code Snippets
// ============================================================================

const tamboCode = `import {
  Message,
  MessageContent,
  ReasoningInfo,
} from "@tambo-ai/ui-registry/components/message";

export function MessageWithReasoning({ message }) {
  return (
    <Message
      role="assistant"
      message={message}
      variant="default"
      className="justify-start"
    >
      <div className="w-full">
        <ReasoningInfo />
        <MessageContent className="text-foreground font-sans" />
      </div>
    </Message>
  );
}`;

const aiElementsCode = `import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";

export function MessageWithReasoning({ message }) {
  return (
    <Message from="assistant">
      {message.reasoning && (
        <Reasoning isStreaming={false} defaultOpen={true}>
          <ReasoningTrigger
            getThinkingMessage={(streaming, duration) =>
              streaming ? "Thinking..." : \`Thought for \${duration}s\`
            }
          />
          <ReasoningContent>
            {message.reasoning.map((step, i) => (
              <div key={i} className="mb-2">{step}</div>
            ))}
          </ReasoningContent>
        </Reasoning>
      )}
      <MessageContent>
        <MessageResponse>{message.text}</MessageResponse>
      </MessageContent>
    </Message>
  );
}`;

const assistantUICode = `import {
  useExternalStoreRuntime,
  AssistantRuntimeProvider,
  ThreadPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";

// Provider for static mock data
function StaticAssistantProvider({ children }) {
  const runtime = useExternalStoreRuntime({
    isRunning: false,
    messages: [userMessage, assistantMessage],
    convertMessage: (msg) => msg,
    onNew: async () => {},
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

function AssistantUIThread() {
  return (
    <StaticAssistantProvider>
      <ThreadPrimitive.Root className="flex flex-col">
        <ThreadPrimitive.Viewport className="flex-1 p-4">
          <ThreadPrimitive.Messages
            components={{
              UserMessage: () => (
                <MessagePrimitive.Root className="flex justify-end mb-4">
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
                    <MessagePrimitive.Content
                      components={{
                        Text: ({ text }) => <p>{text}</p>,
                      }}
                    />
                  </div>
                </MessagePrimitive.Root>
              ),
              AssistantMessage: () => (
                <MessagePrimitive.Root className="flex justify-start mb-4">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <MessagePrimitive.Content
                      components={{
                        Text: ({ text }) => <div>{text}</div>,
                      }}
                    />
                  </div>
                </MessagePrimitive.Root>
              ),
            }}
          />
        </ThreadPrimitive.Viewport>
      </ThreadPrimitive.Root>
    </StaticAssistantProvider>
  );
}`;

// ============================================================================
// Page Component
// ============================================================================

export default function MessageLibraryComparisonPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message Library Comparison
        </h1>
        <p className="text-lg text-muted-foreground">
          Compare how Tambo&apos;s compound component primitives align with
          popular AI chat libraries. All three follow similar architectural
          patterns based on the compound component pattern.
        </p>
      </header>

      {/* Tambo Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tambo Primitives</h2>
        <p className="text-muted-foreground">
          The default implementation using Tambo&apos;s compound Message
          components. Passes the entire message object to the root component
          which provides context to children.
        </p>
        <div className="space-y-6">
          <ComponentCodePreview
            title="User Message"
            component={<TamboUserMessage />}
            code={`<Message role="user" message={message} className="justify-end">
  <div className="max-w-3xl">
    <MessageContent className="text-foreground bg-container" />
  </div>
</Message>;`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant with Reasoning"
            component={<TamboMessageWithReasoning />}
            code={tamboCode}
            previewClassName="p-4"
          />
        </div>
      </section>

      {/* AI Elements Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">AI Elements (Vercel)</h2>
        <p className="text-muted-foreground">
          Same compound component pattern using Vercel&apos;s AI Elements
          library. Uses a <code>from</code> prop instead of <code>role</code>{" "}
          and separates reasoning into a dedicated compound component.
        </p>
        <div className="space-y-6">
          <ComponentCodePreview
            title="User Message"
            component={<AIElementsUserMessage />}
            code={`<Message from="user">
  <MessageContent>
    <MessageResponse>{text}</MessageResponse>
  </MessageContent>
</Message>;`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant with Reasoning"
            component={<AIElementsMessageWithReasoning />}
            code={aiElementsCode}
            previewClassName="p-4"
          />
        </div>
      </section>

      {/* Assistant UI Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Assistant UI</h2>
        <p className="text-muted-foreground">
          Runtime-centric architecture using Assistant UI&apos;s primitives.
          Requires a runtime provider context; messages flow through the runtime
          rather than being passed directly to components.
        </p>
        <ComponentCodePreview
          title="Message Thread"
          component={<AssistantUIThread />}
          code={assistantUICode}
          previewClassName="p-4"
        />
      </section>

      {/* API Comparison Table */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">API Comparison</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Concept</th>
                <th>Tambo</th>
                <th>AI Elements</th>
                <th>Assistant UI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Root Container</td>
                <td>
                  <code>Message</code>
                </td>
                <td>
                  <code>Message</code>
                </td>
                <td>
                  <code>MessagePrimitive.Root</code>
                </td>
              </tr>
              <tr>
                <td>Content Area</td>
                <td>
                  <code>MessageContent</code>
                </td>
                <td>
                  <code>MessageContent</code>
                </td>
                <td>
                  <code>MessagePrimitive.Content</code>
                </td>
              </tr>
              <tr>
                <td>Reasoning Root</td>
                <td>
                  <code>ReasoningInfo</code>
                </td>
                <td>
                  <code>Reasoning</code>
                </td>
                <td>
                  <code>ReasoningGroup</code>
                </td>
              </tr>
              <tr>
                <td>Role Prop</td>
                <td>
                  <code>role=&quot;user&quot;</code>
                </td>
                <td>
                  <code>from=&quot;user&quot;</code>
                </td>
                <td>Via component type</td>
              </tr>
              <tr>
                <td>Data Source</td>
                <td>Message prop</td>
                <td>Props or useChat</td>
                <td>Runtime context</td>
              </tr>
              <tr>
                <td>Context Required</td>
                <td>Optional</td>
                <td>No</td>
                <td>Yes (RuntimeProvider)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Key Observations */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Key Observations</h2>
        <ul className="space-y-2">
          <li>
            <strong>Compound Components:</strong> All three libraries use the
            same pattern - a root component providing context with specialized
            children. This validates Tambo&apos;s architectural approach.
          </li>
          <li>
            <strong>Role-Based Styling:</strong> Each library handles user vs
            assistant styling through the root component&apos;s props or
            context. Tambo and AI Elements use props; Assistant UI infers from
            component type.
          </li>
          <li>
            <strong>Reasoning Support:</strong> All provide collapsible
            reasoning/thinking displays with similar trigger/content patterns.
            This is becoming a standard feature in AI chat interfaces.
          </li>
          <li>
            <strong>Data Flow:</strong> Tambo and AI Elements accept data via
            props (flexible, explicit). Assistant UI requires a runtime provider
            (more structured, opinionated).
          </li>
          <li>
            <strong>Portability:</strong> The similarity in patterns means
            components can be migrated between libraries with minimal structural
            changes - mainly prop renaming and context wrapping.
          </li>
        </ul>
      </section>
    </div>
  );
}
