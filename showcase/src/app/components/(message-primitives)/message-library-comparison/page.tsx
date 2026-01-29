/* eslint-disable @next/next/no-img-element */
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
  userWithImages: {
    id: "user-2",
    role: "user" as const,
    content: [
      {
        type: "text" as const,
        text: "Here are some photos from my trip to San Francisco!",
      },
      {
        type: "image_url" as const,
        image_url: {
          url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=200&fit=crop",
        },
      },
      {
        type: "image_url" as const,
        image_url: {
          url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=300&h=200&fit=crop",
        },
      },
    ],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },
  loading: {
    id: "assistant-loading",
    role: "assistant" as const,
    content: [],
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

// Mock image URLs for demo (since Message.Images extracts from content)
const mockImageUrls = [
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=300&h=200&fit=crop",
];

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

function TamboStyleUserMessageWithImages({ message }: StyleMessageProps) {
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
      <div className="mt-2 flex justify-end gap-2">
        {mockImageUrls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Image ${i + 1}`}
            className="h-20 w-28 rounded-sm object-cover"
          />
        ))}
      </div>
    </Message.Root>
  );
}

function TamboStyleLoadingMessage() {
  return (
    <div className="max-w-prose border-l-2 border-accent pl-4">
      <Message.LoadingIndicator className="flex items-center gap-1 text-muted-foreground [&>span]:h-2 [&>span]:w-2 [&>span]:animate-pulse [&>span]:rounded-full [&>span]:bg-current [&>span[data-dot='1']]:animation-delay-0 [&>span[data-dot='2']]:animation-delay-150 [&>span[data-dot='3']]:animation-delay-300" />
    </div>
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

function AIElementsStyleUserMessageWithImages({ message }: StyleMessageProps) {
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
        <div className="mt-2 flex gap-2">
          {mockImageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Image ${i + 1}`}
              className="h-16 w-24 rounded-lg object-cover"
            />
          ))}
        </div>
      </div>
    </Message.Root>
  );
}

function AIElementsStyleLoadingMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-sm">
        <Message.LoadingIndicator className="flex items-center gap-1 [&>span]:h-2 [&>span]:w-2 [&>span]:animate-bounce [&>span]:rounded-full [&>span]:bg-muted-foreground [&>span[data-dot='2']]:animation-delay-100 [&>span[data-dot='3']]:animation-delay-200" />
      </div>
    </div>
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

function AssistantUIStyleUserMessageWithImages({ message }: StyleMessageProps) {
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
        <div className="mt-2 flex gap-2">
          {mockImageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Image ${i + 1}`}
              className="h-16 w-24 rounded border border-border object-cover"
            />
          ))}
        </div>
      </div>
    </Message.Root>
  );
}

function AssistantUIStyleLoadingMessage() {
  return (
    <div className="mb-3 flex justify-start">
      <div className="max-w-[70%] rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <Message.LoadingIndicator className="flex items-center gap-1.5 [&>span]:h-1.5 [&>span]:w-1.5 [&>span]:animate-pulse [&>span]:rounded-full [&>span]:bg-muted-foreground" />
      </div>
    </div>
  );
}

// ============================================================================
// Neobrutalism Style - "Bold & Tactile"
// Thick borders, offset shadows, bright colors
// ============================================================================

function NeobrutalistUserMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-end"
    >
      <div className="max-w-[75%] rounded-md border-2 border-black bg-yellow-300 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div className="font-medium text-black">{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}

function NeobrutalistAssistantMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-start"
    >
      <div className="max-w-[75%] rounded-md border-2 border-black bg-cyan-200 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div className="font-medium text-black">{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}

function NeobrutalistMessageWithReasoning({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-start"
    >
      <div className="max-w-[75%] rounded-md border-2 border-black bg-cyan-200 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <ReasoningInfo.Root message={message} defaultExpanded={true}>
          <ReasoningInfo.Trigger className="mb-2 flex cursor-pointer items-center gap-1 border-b-2 border-black/20 pb-2 text-xs font-bold uppercase tracking-wide text-black/70 transition-colors hover:text-black">
            <ReasoningInfo.StatusText />
            <ChevronDown className="h-3 w-3" />
          </ReasoningInfo.Trigger>
          <ReasoningInfo.Content className="mb-3 rounded border-2 border-black bg-white/50 p-2">
            <ReasoningInfo.Steps
              render={({ steps }: ReasoningInfoStepsRenderFunctionProps) => (
                <div className="space-y-1 text-xs text-black/80">
                  {steps.map((step: string, i: number) => (
                    <div key={i}>• {step}</div>
                  ))}
                </div>
              )}
            />
          </ReasoningInfo.Content>
        </ReasoningInfo.Root>
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div className="font-medium text-black">{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}

function NeobrutalistToolCallDemo({
  toolName,
  parameters,
  result,
  isLoading,
}: ToolCallDemoProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] rounded-md border-2 border-black bg-lime-300 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-wide text-black"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          <Wrench className="h-3 w-3" />
          <span className="font-mono">{toolName}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
        {isExpanded && (
          <div className="space-y-2 rounded border-2 border-black bg-white/50 p-2">
            <div>
              <div className="text-xs font-bold uppercase text-black/70">
                Parameters
              </div>
              <pre className="mt-1 text-xs text-black">
                {JSON.stringify(parameters, null, 2)}
              </pre>
            </div>
            {result && (
              <div>
                <div className="text-xs font-bold uppercase text-black/70">
                  Result
                </div>
                <pre className="mt-1 text-xs text-black">{result}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NeobrutalistUserMessageWithImages({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-end"
    >
      <div className="max-w-[75%] rounded-md border-2 border-black bg-yellow-300 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div className="font-medium text-black">{markdownContent}</div>
          )}
        />
        <div className="mt-2 flex gap-2">
          {mockImageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Image ${i + 1}`}
              className="h-16 w-24 rounded border-2 border-black object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          ))}
        </div>
      </div>
    </Message.Root>
  );
}

function NeobrutalistLoadingMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] rounded-md border-2 border-black bg-cyan-200 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Message.LoadingIndicator className="flex items-center gap-2 [&>span]:h-3 [&>span]:w-3 [&>span]:animate-bounce [&>span]:rounded-none [&>span]:border-2 [&>span]:border-black [&>span]:bg-black [&>span[data-dot='2']]:animation-delay-100 [&>span[data-dot='3']]:animation-delay-200" />
      </div>
    </div>
  );
}

// ============================================================================
// NES.css Style - "8-Bit Retro"
// Pixel art aesthetic, retro colors, blocky borders
// ============================================================================

function NESStyleUserMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-end"
    >
      <div
        className="max-w-[75%] bg-[#209cee] p-3 text-white"
        style={{
          imageRendering: "pixelated",
          boxShadow:
            "inset -4px -4px #006bb3, inset 4px 4px #6fc5ff, 0 0 0 4px #209cee, 4px 4px 0 4px #000",
        }}
      >
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div style={{ fontFamily: '"Press Start 2P", monospace' }}>
              {markdownContent}
            </div>
          )}
        />
      </div>
    </Message.Root>
  );
}

function NESStyleAssistantMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-start"
    >
      <div
        className="max-w-[75%] bg-white p-3 text-black"
        style={{
          imageRendering: "pixelated",
          boxShadow:
            "inset -4px -4px #adafbc, inset 4px 4px #fff, 0 0 0 4px #212529, 4px 4px 0 4px #000",
        }}
      >
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div style={{ fontFamily: '"Press Start 2P", monospace' }}>
              {markdownContent}
            </div>
          )}
        />
      </div>
    </Message.Root>
  );
}

function NESStyleMessageWithReasoning({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-start"
    >
      <div
        className="max-w-[75%] bg-white p-3 text-black"
        style={{
          imageRendering: "pixelated",
          boxShadow:
            "inset -4px -4px #adafbc, inset 4px 4px #fff, 0 0 0 4px #212529, 4px 4px 0 4px #000",
        }}
      >
        <ReasoningInfo.Root message={message} defaultExpanded={true}>
          <ReasoningInfo.Trigger
            className="mb-2 flex cursor-pointer items-center gap-1 border-b-2 border-dashed border-black pb-2 text-[10px] uppercase text-gray-600 hover:text-black"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <ReasoningInfo.StatusText />
            <ChevronDown className="h-3 w-3" />
          </ReasoningInfo.Trigger>
          <ReasoningInfo.Content
            className="mb-3 bg-[#ffffc0] p-2"
            style={{
              boxShadow:
                "inset -2px -2px #adafbc, inset 2px 2px #fff, 0 0 0 2px #212529",
            }}
          >
            <ReasoningInfo.Steps
              render={({ steps }: ReasoningInfoStepsRenderFunctionProps) => (
                <div
                  className="space-y-1 text-[10px] text-black"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {steps.map((step: string, i: number) => (
                    <div key={i}>▸ {step}</div>
                  ))}
                </div>
              )}
            />
          </ReasoningInfo.Content>
        </ReasoningInfo.Root>
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div style={{ fontFamily: '"Press Start 2P", monospace' }}>
              {markdownContent}
            </div>
          )}
        />
      </div>
    </Message.Root>
  );
}

function NESStyleToolCallDemo({
  toolName,
  parameters,
  result,
  isLoading,
}: ToolCallDemoProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[75%] bg-[#92cc41] p-3 text-black"
        style={{
          imageRendering: "pixelated",
          boxShadow:
            "inset -4px -4px #4aa52e, inset 4px 4px #d4fc79, 0 0 0 4px #212529, 4px 4px 0 4px #000",
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 flex cursor-pointer items-center gap-2 text-[10px] uppercase"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {isLoading ? "..." : "✓"}
          <span>⚒ {toolName}</span>
          <span>{isExpanded ? "▼" : "▶"}</span>
        </button>
        {isExpanded && (
          <div
            className="bg-white/80 p-2"
            style={{
              boxShadow:
                "inset -2px -2px #adafbc, inset 2px 2px #fff, 0 0 0 2px #212529",
            }}
          >
            <div
              className="text-[8px] uppercase text-gray-700"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Parameters
            </div>
            <pre
              className="mt-1 text-[8px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {JSON.stringify(parameters, null, 2)}
            </pre>
            {result && (
              <>
                <div
                  className="mt-2 text-[8px] uppercase text-gray-700"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  Result
                </div>
                <pre
                  className="mt-1 text-[8px]"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {result}
                </pre>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NESStyleUserMessageWithImages({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className="flex justify-end"
    >
      <div
        className="max-w-[75%] bg-[#209cee] p-3 text-white"
        style={{
          imageRendering: "pixelated",
          boxShadow:
            "inset -4px -4px #006bb3, inset 4px 4px #6fc5ff, 0 0 0 4px #209cee, 4px 4px 0 4px #000",
        }}
      >
        <Message.Content
          render={({ markdownContent }: MessageContentRenderProps) => (
            <div style={{ fontFamily: '"Press Start 2P", monospace' }}>
              {markdownContent}
            </div>
          )}
        />
        <div className="mt-2 flex gap-2">
          {mockImageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Image ${i + 1}`}
              className="h-16 w-24 object-cover"
              style={{
                imageRendering: "pixelated",
                boxShadow:
                  "inset -2px -2px #006bb3, inset 2px 2px #6fc5ff, 0 0 0 2px #000",
              }}
            />
          ))}
        </div>
      </div>
    </Message.Root>
  );
}

function NESStyleLoadingMessage() {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[75%] bg-white p-3 text-black"
        style={{
          imageRendering: "pixelated",
          boxShadow:
            "inset -4px -4px #adafbc, inset 4px 4px #fff, 0 0 0 4px #212529, 4px 4px 0 4px #000",
        }}
      >
        <div
          className="animate-pulse text-[10px]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          Loading...
        </div>
      </div>
    </div>
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

const neobrutalistCode = `import { Message } from "@tambo-ai/ui-registry/base/message";
import { ReasoningInfo } from "@tambo-ai/ui-registry/base/reasoning-info";

// Neobrutalism Style - Bold borders, offset shadows, bright colors
function NeobrutalistMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
    >
      <div className={cn(
        "max-w-[75%] rounded-md border-2 border-black px-4 py-2",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        message.role === "user" ? "bg-yellow-300" : "bg-cyan-200"
      )}>
        <Message.Content
          render={({ markdownContent }) => (
            <div className="font-medium text-black">{markdownContent}</div>
          )}
        />
      </div>
    </Message.Root>
  );
}`;

const nesCode = `import { Message } from "@tambo-ai/ui-registry/base/message";
import { ReasoningInfo } from "@tambo-ai/ui-registry/base/reasoning-info";

// NES.css Style - 8-bit retro pixel art aesthetic
function NESStyleMessage({ message }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn("max-w-[75%] p-3", message.role === "user" ? "bg-[#209cee] text-white" : "bg-white text-black")}
        style={{
          imageRendering: "pixelated",
          boxShadow: message.role === "user"
            ? "inset -4px -4px #006bb3, inset 4px 4px #6fc5ff, 0 0 0 4px #209cee, 4px 4px 0 4px #000"
            : "inset -4px -4px #adafbc, inset 4px 4px #fff, 0 0 0 4px #212529, 4px 4px 0 4px #000"
        }}
      >
        <Message.Content
          render={({ markdownContent }) => (
            <div style={{ fontFamily: '"Press Start 2P", monospace' }}>{markdownContent}</div>
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
          All five examples below use the same <code>Message.Root</code>,{" "}
          <code>Message.Content</code>, <code>Message.Images</code>,{" "}
          <code>Message.LoadingIndicator</code>, and <code>ReasoningInfo</code>{" "}
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
              <TamboStyleUserMessageWithImages
                message={mockMessages.userWithImages}
              />
              <TamboStyleLoadingMessage />
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
              <AIElementsStyleUserMessageWithImages
                message={mockMessages.userWithImages}
              />
              <AIElementsStyleLoadingMessage />
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
              <AssistantUIStyleUserMessageWithImages
                message={mockMessages.userWithImages}
              />
              <AssistantUIStyleLoadingMessage />
            </div>
          }
          code={assistantUICode}
          previewClassName="p-4"
        />
      </section>

      {/* Neobrutalism Style Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Neobrutalism Style - &quot;Bold &amp; Tactile&quot;
        </h2>
        <p className="text-muted-foreground">
          Bold design with thick black borders, offset shadows, and bright
          accent colors. Features a tactile &quot;press&quot; effect on hover.
          Inspired by{" "}
          <a
            href="https://www.neobrutalism.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            neobrutalism.dev
          </a>
          .
        </p>
        <ComponentCodePreview
          title="Complete Conversation"
          component={
            <div className="space-y-4">
              <NeobrutalistUserMessage message={mockMessages.user} />
              <NeobrutalistMessageWithReasoning
                message={mockMessages.withReasoning}
              />
              <NeobrutalistToolCallDemo
                toolName={mockToolCall.toolName}
                parameters={mockToolCall.parameters}
                result={mockToolCall.result}
              />
              <NeobrutalistAssistantMessage message={mockMessages.assistant} />
              <NeobrutalistUserMessageWithImages
                message={mockMessages.userWithImages}
              />
              <NeobrutalistLoadingMessage />
            </div>
          }
          code={neobrutalistCode}
          previewClassName="p-4 bg-[#f5f5f5]"
        />
      </section>

      {/* NES.css Style Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">
          NES.css Style - &quot;8-Bit Retro&quot;
        </h2>
        <p className="text-muted-foreground">
          Pixel art aesthetic inspired by the Nintendo Entertainment System.
          Features chunky inset/outset shadows and retro color palette. Based on{" "}
          <a
            href="https://github.com/nostalgic-css/NES.css"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            NES.css
          </a>
          . Works best with the &quot;Press Start 2P&quot; font.
        </p>
        <ComponentCodePreview
          title="Complete Conversation"
          component={
            <div className="space-y-6">
              <NESStyleUserMessage message={mockMessages.user} />
              <NESStyleMessageWithReasoning
                message={mockMessages.withReasoning}
              />
              <NESStyleToolCallDemo
                toolName={mockToolCall.toolName}
                parameters={mockToolCall.parameters}
                result={mockToolCall.result}
              />
              <NESStyleAssistantMessage message={mockMessages.assistant} />
              <NESStyleUserMessageWithImages
                message={mockMessages.userWithImages}
              />
              <NESStyleLoadingMessage />
            </div>
          }
          code={nesCode}
          previewClassName="p-6 bg-[#212529]"
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
                  <code>Message.Images</code>
                </td>
                <td>Renders images from message content</td>
                <td>
                  <code>renderImage</code> (render function with url, index,
                  alt)
                </td>
              </tr>
              <tr>
                <td>
                  <code>Message.LoadingIndicator</code>
                </td>
                <td>Animated loading dots for streaming</td>
                <td>
                  Renders 3 spans with <code>data-dot=&quot;1|2|3&quot;</code>
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
            calls, final responses, image attachments, and loading states - all
            styled consistently.
          </li>
          <li>
            <strong>Same Primitives, Different Styles:</strong> All five
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
          <li>
            <strong>Rich Content Support:</strong> <code>Message.Images</code>{" "}
            handles image content with customizable rendering, while{" "}
            <code>Message.LoadingIndicator</code> provides animated dots with{" "}
            <code>data-dot</code> attributes for CSS animation control.
          </li>
        </ul>
      </section>
    </div>
  );
}
