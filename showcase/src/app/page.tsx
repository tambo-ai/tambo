"use client";

import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import Link from "next/link";
import { DemoWrapper } from "./components/demo-wrapper";

export default function DocsPage() {
  const userContextKey = useUserContextKey("message-thread-full-showcase");

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Hero Section */}
      <div className="flex flex-col items-start text-left mb-16">
        <h1 className="font-sentient text-5xl font-bold">
          Build your AI app faster
        </h1>
        <p className="text-2xl text-muted-foreground mt-4 mb-8">
          Components with AI superpowers built on top of tambo-ai.
        </p>
        <div className="flex gap-4">
          <Link
            href="/get-started"
            className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="https://tambo.co"
            className="border border-black text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            What is tambo-ai?
          </Link>
        </div>
      </div>

      {/* Demo Chat Component */}
      <ShowcaseThemeProvider defaultTheme="light">
        <DemoWrapper title="Message Thread" height={600} hidePreviewHeading>
          <MessageThreadFull
            contextKey={userContextKey}
            style={{ height: "100%" }}
          />
        </DemoWrapper>
      </ShowcaseThemeProvider>
    </div>
  );
}
