"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import type { TamboThreadMessage } from "@tambo-ai/react";
import {
  Message,
  type MessageContentRenderProps,
} from "@tambo-ai/ui-registry/base/message";
import {
  ReasoningInfo,
  type ReasoningInfoStepsRenderFunctionProps,
} from "@tambo-ai/ui-registry/base/reasoning-info";
import { ChevronDown } from "lucide-react";

// ============================================================================
// Type Definitions
// ============================================================================

type MessageRole = "user" | "assistant";

interface StyleMessageProps {
  message: TamboThreadMessage & { role: MessageRole };
  isLoading?: boolean;
}

// ============================================================================
// Mock Messages for Demos
// ============================================================================

const mockMessages = {
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
} satisfies Record<string, TamboThreadMessage>;

// ============================================================================
// Tambo Style - "Editorial Clarity"
// Refined minimalism with typographic focus. No bubbles.
// ============================================================================

function TamboStyleUserMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="ml-auto max-w-prose text-right"
    >
      <Message.Content
        render={({ markdownContent }: MessageContentRenderProps) => (
          <div className="rounded-sm bg-muted/30 px-4 py-2 text-foreground">
            {markdownContent}
          </div>
        )}
      />
    </Message.Root>
  );
}

function TamboStyleMessageWithReasoning({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="max-w-prose border-l-2 border-accent pl-4"
    >
      <ReasoningInfo.Root message={message} defaultExpanded={true}>
        <ReasoningInfo.Trigger className="mb-2 flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ReasoningInfo.StatusText />
          <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
        </ReasoningInfo.Trigger>
        <ReasoningInfo.Content className="mb-4 rounded-md bg-muted/50 p-3">
          <ReasoningInfo.Steps
            render={({ steps }: ReasoningInfoStepsRenderFunctionProps) => (
              <div className="space-y-2 text-xs text-muted-foreground">
                {steps.map((step: string, i: number) => (
                  <div key={i}>{step}</div>
                ))}
              </div>
            )}
          />
        </ReasoningInfo.Content>
      </ReasoningInfo.Root>
      <Message.Content
        render={({ markdownContent }: MessageContentRenderProps) => (
          <div className="prose prose-lg leading-relaxed text-foreground">
            {markdownContent}
          </div>
        )}
      />
    </Message.Root>
  );
}

// ============================================================================
// AI Elements Style - "Geometric Conversation"
// Flex layout with rounded bubbles and role-based positioning.
// ============================================================================

function AIElementsStyleUserMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-end"
    >
      <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div>{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}

function AIElementsStyleMessageWithReasoning({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-start"
    >
      <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-sm">
        <ReasoningInfo.Root message={message} defaultExpanded={true}>
          <ReasoningInfo.Trigger className="mb-2 flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ReasoningInfo.StatusText />
            <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
          </ReasoningInfo.Trigger>
          <ReasoningInfo.Content className="mb-3 rounded-md bg-background/50 p-2">
            <ReasoningInfo.Steps
              render={({ steps }: ReasoningInfoStepsRenderFunctionProps) => (
                <div className="space-y-1 text-xs text-muted-foreground">
                  {steps.map((step: string, i: number) => (
                    <div key={i}>{step}</div>
                  ))}
                </div>
              )}
            />
          </ReasoningInfo.Content>
        </ReasoningInfo.Root>
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div>{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}

// ============================================================================
// Assistant UI Style - "Contained Dialogue"
// Card-like containers with borders. More structured, app-like feel.
// ============================================================================

function AssistantUIStyleUserMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="mb-3 flex justify-end"
    >
      <div className="max-w-[70%] rounded-lg border border-primary/20 bg-card px-4 py-2">
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div className="prose prose-sm max-w-none">{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}

function AssistantUIStyleMessageWithReasoning({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="mb-3 flex justify-start"
    >
      <div className="max-w-[70%] rounded-lg border border-border bg-card px-4 py-2 shadow-sm">
        <ReasoningInfo.Root message={message} defaultExpanded={true}>
          <ReasoningInfo.Trigger className="mb-2 flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ReasoningInfo.StatusText />
            <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
          </ReasoningInfo.Trigger>
          <ReasoningInfo.Content className="mb-3 rounded border border-border bg-muted/40 p-2">
            <ReasoningInfo.Steps
              className="space-y-1 text-xs"
              render={({ steps }) =>
                steps.map((step: string, i: number) => (
                  <div key={i}>{step}</div>
                ))
              }
            />
          </ReasoningInfo.Content>
        </ReasoningInfo.Root>
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div className="prose prose-sm max-w-none">{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}

// ============================================================================
// Code Snippets
// ============================================================================

const tamboCode = `import { Message } from "@tambo-ai/ui-registry/base/message";
import { ReasoningInfo } from "@tambo-ai/ui-registry/base/reasoning-info";
import { ChevronDown } from "lucide-react";

interface StyleMessageProps {
  message: TamboThreadMessage;
}

// Tambo Style - Editorial clarity with typography focus
function TamboStyleMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="max-w-prose border-l-2 border-accent pl-4"
    >
      <ReasoningInfo.Root message={message} defaultExpanded={true}>
        <ReasoningInfo.Trigger className="mb-2 flex items-center gap-1 text-xs">
          <ReasoningInfo.StatusText />
          <ChevronDown className="h-3 w-3" />
        </ReasoningInfo.Trigger>
        <ReasoningInfo.Content className="mb-4 rounded-md bg-muted/50 p-3">
          <ReasoningInfo.Steps
            render={({ steps }) => (
              <div className="space-y-2 text-xs">
                {steps.map((step, i) => <div key={i}>{step}</div>)}
              </div>
            )}
          />
        </ReasoningInfo.Content>
      </ReasoningInfo.Root>
      <Message.Content
        render={({ markdownContent }) => (
          <div className="prose prose-lg">{markdownContent}</div>
        )}
      />
    </Message.Root>
  );
}`;

const aiElementsCode = `import { Message } from "@tambo-ai/ui-registry/base/message";
import { ReasoningInfo } from "@tambo-ai/ui-registry/base/reasoning-info";
import { ChevronDown } from "lucide-react";

// AI Elements Style - Rounded bubbles with flex layout
function AIElementsStyleMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className={cn(
        "flex",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
        message.role === "user"
          ? "bg-primary text-primary-foreground"
          : "bg-muted"
      )}>
        <ReasoningInfo.Root message={message} defaultExpanded={true}>
          <ReasoningInfo.Trigger className="mb-2 flex items-center gap-1 text-xs">
            <ReasoningInfo.StatusText />
            <ChevronDown className="h-3 w-3" />
          </ReasoningInfo.Trigger>
          <ReasoningInfo.Content className="mb-3 rounded-md bg-background/50 p-2">
            <ReasoningInfo.Steps
              render={({ steps }) => (
                <div className="space-y-1 text-xs">
                  {steps.map((step, i) => <div key={i}>{step}</div>)}
                </div>
              )}
            />
          </ReasoningInfo.Content>
        </ReasoningInfo.Root>
        <Message.Content
          render={({ markdownContent }) => <div>{markdownContent}</div>}
        />
      </div>
    </Message.Root>
  );
}`;

const assistantUICode = `import { Message } from "@tambo-ai/ui-registry/base/message";
import { ReasoningInfo } from "@tambo-ai/ui-registry/base/reasoning-info";
import { ChevronDown } from "lucide-react";

// Assistant UI Style - Card-like containers with borders
function AssistantUIStyleMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className={cn(
        "mb-3 flex",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[70%] rounded-lg border px-4 py-2",
        message.role === "user"
          ? "border-primary/20 bg-card"
          : "border-border bg-card shadow-sm"
      )}>
        <ReasoningInfo.Root message={message} defaultExpanded={true}>
          <ReasoningInfo.Trigger className="mb-2 flex items-center gap-1 text-xs">
            <ReasoningInfo.StatusText />
            <ChevronDown className="h-3 w-3" />
          </ReasoningInfo.Trigger>
          <ReasoningInfo.Content className="mb-3 rounded border bg-muted/40 p-2">
            <ReasoningInfo.Steps
              className="space-y-1 text-xs"
              render={({ steps }) =>
                steps.map((step: string, i: number) => (
                  <div key={i}>{step}</div>
                ))
              }
            />
          </ReasoningInfo.Content>
        </ReasoningInfo.Root>
        <Message.Content
          render={({ markdownContent }) => (
            <div className="prose prose-sm max-w-none">{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}`;

// ============================================================================
// Page Component
// ============================================================================

export default function MessageLibraryComparisonPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Base Primitives Demo
        </h1>
        <p className="text-lg text-muted-foreground">
          Tambo&apos;s base primitives can be styled to match any design system.
          All three examples below use the same <code>Message.Root</code>,{" "}
          <code>Message.Content</code>, and <code>ReasoningInfo</code>{" "}
          primitives with different CSS styling.
        </p>
      </header>

      {/* Tambo Style Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Tambo Style - &quot;Editorial Clarity&quot;
        </h2>
        <p className="text-muted-foreground">
          Refined minimalism with typographic focus. Uses a left border accent
          for assistant messages and right-aligned user messages. No bubbles -
          let typography and whitespace do the work.
        </p>
        <div className="space-y-6">
          <ComponentCodePreview
            title="User Message"
            component={<TamboStyleUserMessage message={mockMessages.user} />}
            code={`<Message.Root role="user" message={message} className="ml-auto max-w-prose text-right">
  <Message.Content
    render={({ markdownContent }) => (
      <div className="rounded-sm bg-muted/30 px-4 py-2">{markdownContent}</div>
    )}
  />
</Message.Root>`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant with Reasoning"
            component={
              <TamboStyleMessageWithReasoning
                message={mockMessages.withReasoning}
              />
            }
            code={tamboCode}
            previewClassName="p-4"
          />
        </div>
      </section>

      {/* AI Elements Style Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          AI Elements Style - &quot;Geometric Conversation&quot;
        </h2>
        <p className="text-muted-foreground">
          Modern SaaS chat aesthetic with flex layout, rounded bubbles, and
          role-based positioning. User messages are primary-colored and
          right-aligned; assistant messages use muted backgrounds.
        </p>
        <div className="space-y-6">
          <ComponentCodePreview
            title="User Message"
            component={
              <AIElementsStyleUserMessage message={mockMessages.user} />
            }
            code={`<Message.Root role="user" message={message} className="flex justify-end">
  <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
    <Message.Content
      render={({ markdownContent }) => <div>{markdownContent}</div>}
    />
  </div>
</Message.Root>`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant with Reasoning"
            component={
              <AIElementsStyleMessageWithReasoning
                message={mockMessages.withReasoning}
              />
            }
            code={aiElementsCode}
            previewClassName="p-4"
          />
        </div>
      </section>

      {/* Assistant UI Style Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Assistant UI Style - &quot;Contained Dialogue&quot;
        </h2>
        <p className="text-muted-foreground">
          Card-like containers with borders for a more structured, app-like
          feel. Uses subtle shadows and border styling to create visual
          separation between messages.
        </p>
        <div className="space-y-6">
          <ComponentCodePreview
            title="User Message"
            component={
              <AssistantUIStyleUserMessage message={mockMessages.user} />
            }
            code={`<Message.Root role="user" message={message} className="mb-3 flex justify-end">
  <div className="max-w-[70%] rounded-lg border border-primary/20 bg-card px-4 py-2">
    <Message.Content
      render={({ markdownContent }) => (
        <div className="prose prose-sm max-w-none">{markdownContent}</div>
      )}
    />
  </div>
</Message.Root>`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant with Reasoning"
            component={
              <AssistantUIStyleMessageWithReasoning
                message={mockMessages.withReasoning}
              />
            }
            code={assistantUICode}
            previewClassName="p-4"
          />
        </div>
      </section>

      {/* API Comparison Table */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Base Primitive API</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Purpose</th>
                <th>Key Props</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>Message.Root</code>
                </td>
                <td>Container that provides message context</td>
                <td>
                  <code>role</code>, <code>message</code>,{" "}
                  <code>isLoading</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>Message.Content</code>
                </td>
                <td>Renders message text with render props</td>
                <td>
                  <code>children</code> (render function)
                </td>
              </tr>
              <tr>
                <td>
                  <code>ReasoningInfo.Root</code>
                </td>
                <td>Container for reasoning display</td>
                <td>
                  <code>message</code>, <code>defaultExpanded</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>ReasoningInfo.Trigger</code>
                </td>
                <td>Toggle button for expand/collapse</td>
                <td>Standard button props</td>
              </tr>
              <tr>
                <td>
                  <code>ReasoningInfo.StatusText</code>
                </td>
                <td>Displays &quot;Thinking...&quot; or duration</td>
                <td>Auto-generated from context</td>
              </tr>
              <tr>
                <td>
                  <code>ReasoningInfo.Content</code>
                </td>
                <td>Collapsible content area</td>
                <td>
                  <code>forceMount</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>ReasoningInfo.Steps</code>
                </td>
                <td>Renders reasoning steps</td>
                <td>
                  <code>children</code> (render function)
                </td>
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
            <strong>Same Primitives, Different Styles:</strong> All three
            examples use identical <code>Message</code> and{" "}
            <code>ReasoningInfo</code> base primitives. Visual differences come
            entirely from CSS classes passed to the primitives.
          </li>
          <li>
            <strong>Render Props Pattern:</strong> The{" "}
            <code>Message.Content</code> and <code>ReasoningInfo.Steps</code>{" "}
            components use render props to give you full control over how
            content is displayed.
          </li>
          <li>
            <strong>Data Attributes:</strong> Base primitives expose{" "}
            <code>data-message-role</code>, <code>data-state</code>, and other
            attributes for CSS-only styling without JavaScript.
          </li>
          <li>
            <strong>No Runtime Dependencies:</strong> Unlike some libraries that
            require runtime providers, Tambo primitives accept data directly via
            props for maximum flexibility.
          </li>
          <li>
            <strong>Compound Component Pattern:</strong> The namespace structure
            (<code>Message.Root</code>, <code>Message.Content</code>) follows
            the same pattern as Radix UI, Headless UI, and other modern
            component libraries.
          </li>
        </ul>
      </section>
    </div>
  );
}
