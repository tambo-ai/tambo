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
import { Check, ChevronDown, Loader2, Wrench } from "lucide-react";
import * as React from "react";

// ============================================================================
// Type Definitions
// ============================================================================

type MessageRole = "user" | "assistant";

interface StyleMessageProps {
  message: TamboThreadMessage & { role: MessageRole };
  isLoading?: boolean;
}

interface ToolCallDemoProps {
  toolName: string;
  parameters: Record<string, unknown>;
  result?: string;
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
        text: "What's the weather like in San Francisco?",
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
        text: "Based on the weather data, San Francisco is currently **62°F** (17°C) with partly cloudy skies. Perfect weather for a walk!",
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
        text: "I'll check the current weather conditions for you.",
      },
    ],
    reasoning: [
      "The user is asking about weather in San Francisco. I should use the weather tool to get current conditions.",
      "I'll fetch temperature, conditions, and any relevant weather alerts.",
    ],
    reasoningDurationMS: 2500,
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },
} satisfies Record<string, TamboThreadMessage>;

// Mock tool call data for demos
const mockToolCall = {
  toolName: "get_weather",
  parameters: { city: "San Francisco", units: "fahrenheit" },
  result: '{"temperature": 62, "conditions": "partly cloudy", "humidity": 65}',
};

// ============================================================================
// Tool Call Demo Components
// These demonstrate styling patterns without requiring TamboProvider context
// ============================================================================

function TamboStyleToolCallDemo({
  toolName,
  parameters,
  result,
  isLoading,
}: ToolCallDemoProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  return (
    <div className="max-w-prose border-l-2 border-accent pl-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4 text-green-500" />
        )}
        <Wrench className="h-3 w-3" />
        <span className="font-mono">{toolName}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      {isExpanded && (
        <div className="mb-4 space-y-2 rounded-md bg-muted/50 p-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Parameters
            </div>
            <pre className="mt-1 text-xs">
              {JSON.stringify(parameters, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Result
              </div>
              <pre className="mt-1 text-xs">{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AIElementsStyleToolCallDemo({
  toolName,
  parameters,
  result,
  isLoading,
}: ToolCallDemoProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-green-500" />
          )}
          <Wrench className="h-3 w-3" />
          <span className="font-mono">{toolName}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
        {isExpanded && (
          <div className="space-y-2 rounded-md bg-background/50 p-2">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Parameters
              </div>
              <pre className="mt-1 text-xs">
                {JSON.stringify(parameters, null, 2)}
              </pre>
            </div>
            {result && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Result
                </div>
                <pre className="mt-1 text-xs">{result}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantUIStyleToolCallDemo({
  toolName,
  parameters,
  result,
  isLoading,
}: ToolCallDemoProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  return (
    <div className="mb-3 flex justify-start">
      <div className="max-w-[70%] rounded-lg border border-border bg-card px-4 py-2 shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-green-500" />
          )}
          <Wrench className="h-3 w-3" />
          <span className="font-mono">{toolName}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
        {isExpanded && (
          <div className="space-y-2 rounded border border-border bg-muted/40 p-2">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Parameters
              </div>
              <pre className="mt-1 text-xs">
                {JSON.stringify(parameters, null, 2)}
              </pre>
            </div>
            {result && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Result
                </div>
                <pre className="mt-1 text-xs">{result}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

function TamboStyleAssistantMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="max-w-prose border-l-2 border-accent pl-4"
    >
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

function AIElementsStyleAssistantMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-start"
    >
      <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-sm">
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

function AssistantUIStyleAssistantMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="mb-3 flex justify-start"
    >
      <div className="max-w-[70%] rounded-lg border border-border bg-card px-4 py-2 shadow-sm">
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
        <ComponentCodePreview
          title="Complete Conversation"
          component={
            <div className="space-y-4">
              <TamboStyleUserMessage message={mockMessages.user} />
              <TamboStyleMessageWithReasoning
                message={mockMessages.withReasoning}
              />
              <TamboStyleToolCallDemo
                toolName={mockToolCall.toolName}
                parameters={mockToolCall.parameters}
                result={mockToolCall.result}
              />
              <TamboStyleAssistantMessage message={mockMessages.assistant} />
            </div>
          }
          code={tamboCode}
          previewClassName="p-4"
        />
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
        <ComponentCodePreview
          title="Complete Conversation"
          component={
            <div className="space-y-4">
              <AIElementsStyleUserMessage message={mockMessages.user} />
              <AIElementsStyleMessageWithReasoning
                message={mockMessages.withReasoning}
              />
              <AIElementsStyleToolCallDemo
                toolName={mockToolCall.toolName}
                parameters={mockToolCall.parameters}
                result={mockToolCall.result}
              />
              <AIElementsStyleAssistantMessage
                message={mockMessages.assistant}
              />
            </div>
          }
          code={aiElementsCode}
          previewClassName="p-4"
        />
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
        <ComponentCodePreview
          title="Complete Conversation"
          component={
            <div className="space-y-4">
              <AssistantUIStyleUserMessage message={mockMessages.user} />
              <AssistantUIStyleMessageWithReasoning
                message={mockMessages.withReasoning}
              />
              <AssistantUIStyleToolCallDemo
                toolName={mockToolCall.toolName}
                parameters={mockToolCall.parameters}
                result={mockToolCall.result}
              />
              <AssistantUIStyleAssistantMessage
                message={mockMessages.assistant}
              />
            </div>
          }
          code={assistantUICode}
          previewClassName="p-4"
        />
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
                  <code>render</code> (render function)
                </td>
              </tr>
              <tr>
                <td>
                  <code>ToolcallInfo.Root</code>
                </td>
                <td>Container for tool call display</td>
                <td>
                  <code>message</code>, <code>defaultExpanded</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>ToolcallInfo.Trigger</code>
                </td>
                <td>Toggle button for tool call details</td>
                <td>Standard button props</td>
              </tr>
              <tr>
                <td>
                  <code>ToolcallInfo.ToolName</code>
                </td>
                <td>Displays the tool name</td>
                <td>Auto-generated from context</td>
              </tr>
              <tr>
                <td>
                  <code>ToolcallInfo.Parameters</code>
                </td>
                <td>Renders tool call parameters</td>
                <td>
                  <code>render</code> (render function)
                </td>
              </tr>
              <tr>
                <td>
                  <code>ToolcallInfo.Result</code>
                </td>
                <td>Renders tool call result</td>
                <td>
                  <code>render</code> (render function)
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
            <strong>Complete Conversation Flow:</strong> Each style demo shows a
            full conversation including user messages, assistant reasoning, tool
            calls, and final responses - all styled consistently.
          </li>
          <li>
            <strong>Same Primitives, Different Styles:</strong> All three
            examples use identical <code>Message</code>,{" "}
            <code>ReasoningInfo</code>, and <code>ToolcallInfo</code> base
            primitives. Visual differences come entirely from CSS.
          </li>
          <li>
            <strong>Render Props Pattern:</strong> Components like{" "}
            <code>Message.Content</code>, <code>ReasoningInfo.Steps</code>, and{" "}
            <code>ToolcallInfo.Parameters</code> use render props for full
            control over content display.
          </li>
          <li>
            <strong>Data Attributes:</strong> Base primitives expose{" "}
            <code>data-message-role</code>, <code>data-state</code>, and other
            attributes for CSS-only styling without JavaScript.
          </li>
          <li>
            <strong>Compound Component Pattern:</strong> The namespace structure
            (<code>Message.Root</code>, <code>ToolcallInfo.Root</code>) follows
            the same pattern as Radix UI and other modern component libraries.
          </li>
        </ul>
      </section>
    </div>
  );
}
