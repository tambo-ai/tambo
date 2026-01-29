"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { Thread } from "@/components/assistant-ui/thread";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";

const demoChatModelAdapter: ChatModelAdapter = {
  async *run({ abortSignal }) {
    if (abortSignal.aborted) return;

    yield {
      content: [
        {
          type: "text",
          text: "This is a local demo response from Assistant UI.",
        },
      ],
      status: { type: "complete", reason: "stop" },
    };
  },
};

function AssistantUiThreadPreview() {
  const runtime = useLocalRuntime(demoChatModelAdapter, {
    initialMessages: [
      {
        role: "assistant",
        content:
          "Hello! This thread is rendered with Assistant UI (no network calls).",
      },
      {
        role: "user",
        content: "Nice — show me a second assistant message.",
      },
      {
        role: "assistant",
        content:
          "Sure. You can type in the composer below and the local adapter will reply.",
      },
    ],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="not-prose h-[520px] overflow-hidden rounded-lg border bg-background">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}

export default function MessageAssistantUiPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message (Assistant UI)
        </h1>
        <p className="text-lg text-muted-foreground">
          A temporary demo using Assistant UI primitives (via the assistant
          modal + thread components) to render messages.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>
        <div className="space-y-6">
          <ComponentCodePreview
            title="Assistant UI Thread"
            component={<AssistantUiThreadPreview />}
            code={`import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";

const chatModelAdapter: ChatModelAdapter = {
  async *run() {
    yield {
      content: [{ type: "text", text: "Hello from the local adapter." }],
      status: { type: "complete", reason: "stop" },
    };
  },
};

export function AssistantUiThread() {
  const runtime = useLocalRuntime(chatModelAdapter, {
    initialMessages: [{ role: "assistant", content: "Hello!" }],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}`}
            previewClassName="p-0"
          />
        </div>
      </section>

      <section>
        <InstallationSection cliCommand='npx shadcn@latest add "https://r.assistant-ui.com/assistant-modal.json"' />
      </section>
    </div>
  );
}
