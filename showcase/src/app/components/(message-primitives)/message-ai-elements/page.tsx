"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import {
  Message as AiElementsMessage,
  MessageContent as AiElementsMessageContent,
  MessageResponse as AiElementsMessageResponse,
} from "@/components/ai-elements/message";

export default function MessageAiElementsPage() {
  const userText = "Hello! Can you help me with a React component?";
  const assistantText =
    "Of course! I'd be happy to help you with your React component. What specifically would you like to know?";
  const assistantTextWithMarkdown = [
    "Here's a simple button component for you:",
    "",
    "```tsx",
    "export function Button() {",
    "  return <button>Click me!</button>;",
    "}",
    "```",
  ].join("\n");

  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message (AI Elements)
        </h1>
        <p className="text-lg text-muted-foreground">
          A temporary demo showing how the Tambo message primitives can be
          composed with the AI Elements UI patterns.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>
        <div className="space-y-6">
          <ComponentCodePreview
            title="User Message"
            component={
              <AiElementsMessage from="user">
                <AiElementsMessageContent>
                  <AiElementsMessageResponse>
                    {userText}
                  </AiElementsMessageResponse>
                </AiElementsMessageContent>
              </AiElementsMessage>
            }
            code={`import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

export function UserMessage() {
  return (
    <Message from="user">
      <MessageContent>
        <MessageResponse>{"Hello!"}</MessageResponse>
      </MessageContent>
    </Message>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant Message"
            component={
              <AiElementsMessage from="assistant">
                <AiElementsMessageContent>
                  <AiElementsMessageResponse>
                    {assistantText}
                  </AiElementsMessageResponse>
                </AiElementsMessageContent>
              </AiElementsMessage>
            }
            code={`import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

export function AssistantMessage() {
  return (
    <Message from="assistant">
      <MessageContent>
        <MessageResponse>{"Hello!"}</MessageResponse>
      </MessageContent>
    </Message>
  );
}`}
            previewClassName="p-4"
          />

          <ComponentCodePreview
            title="Assistant Message with Markdown"
            component={
              <AiElementsMessage from="assistant">
                <AiElementsMessageContent>
                  <AiElementsMessageResponse>
                    {assistantTextWithMarkdown}
                  </AiElementsMessageResponse>
                </AiElementsMessageContent>
              </AiElementsMessage>
            }
            code={`import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

export function AssistantMessageWithMarkdown() {
  return (
    <Message from="assistant">
      <MessageContent>
        <MessageResponse>{markdown}</MessageResponse>
      </MessageContent>
    </Message>
  );
}`}
            previewClassName="p-4"
          />
        </div>
      </section>

      <section>
        <InstallationSection cliCommand='npx shadcn@latest add "https://registry.ai-sdk.dev/message.json"' />
      </section>
    </div>
  );
}
