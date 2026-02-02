"use client";

import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";
import Link from "next/link";
import { DemoWrapper } from "./components/demo-wrapper";

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
            <MessageThreadFull />
          </div>
        </DemoWrapper>
      </section>
    </div>
  );
}
