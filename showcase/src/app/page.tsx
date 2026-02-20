"use client";

import type { Suggestion } from "@tambo-ai/react";
import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";
import Link from "next/link";
import { DemoWrapper } from "./components/demo-wrapper";

const homeThreadSuggestions = [
  {
    id: "home-suggestion-1",
    title: "Add a thread",
    detailedSuggestion: "Show me how to add MessageThreadFull to a page.",
    messageId: "home-add-thread",
  },
  {
    id: "home-suggestion-2",
    title: "Pick a variant",
    detailedSuggestion:
      "What should I use for my app: full, collapsible, or panel thread?",
    messageId: "home-pick-variant",
  },
  {
    id: "home-suggestion-3",
    title: "Starter prompts",
    detailedSuggestion:
      "Give me three prompts I can use to test components quickly.",
    messageId: "home-starter-prompts",
  },
] satisfies Suggestion[];

export default function DocsPage() {
  return (
    <div className="max-w-8xl">
      {/* Hero Section */}
      <div className="flex flex-col items-start text-left mb-16">
        <h1 className="font-sentient text-5xl font-450">
          Build your AI app faster
        </h1>
        <p className="text-2xl text-muted-foreground mt-4 mb-8">
          Components with AI superpowers built on top of tambo-ai.
        </p>
        <div className="flex gap-4">
          <Link
            href="/get-started"
            className="bg-foreground text-background px-6 py-3 rounded-full font-medium hover:bg-foreground/90 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="https://tambo.co"
            className="border border-border text-foreground px-6 py-3 rounded-full font-medium hover:bg-muted transition-colors"
          >
            What is tambo-ai?
          </Link>
        </div>
      </div>

      {/* Live demo section */}
      <section
        aria-labelledby="showcase-live-demo-heading"
        className="space-y-6"
      >
        <h2
          id="showcase-live-demo-heading"
          className="text-2xl md:text-3xl font-semibold tracking-tight"
        >
          Live demo
        </h2>
        <DemoWrapper title="Message Thread" height={600} hidePreviewHeading>
          <div className="h-full relative flex flex-col rounded-lg overflow-hidden">
            <MessageThreadFull initialSuggestions={homeThreadSuggestions} />
          </div>
        </DemoWrapper>
      </section>
    </div>
  );
}
