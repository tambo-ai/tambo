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
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-8">
          Explore production-ready AI components and blocks you can drop into your app.
        </p>

        <h2 className="text-2xl font-semibold mb-2">Features</h2>
        <ul className="list-disc pl-6 mb-8 text-muted-foreground">
          <li>Composable UI building blocks for chat and generative interfaces</li>
          <li>Accessible by default, themable, and framework-friendly</li>
          <li>Fast iteration with copyable prompts and live demos</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-3">Live Demo</h2>
        <DemoWrapper title="Message Thread" height={600} hidePreviewHeading>
          <div className="h-full relative flex flex-col rounded-lg overflow-hidden">
            <MessageThreadFull contextKey={userContextKey} />
          </div>
        </DemoWrapper>
      </ShowcaseThemeProvider>

      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-semibold">Get Started</h2>
        <p className="text-muted-foreground">
          Head to the setup guide to install components and configure your provider.
        </p>
        <Link href="/get-started" className="underline">
          Read the guide
        </Link>
      </div>

      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold">FAQs</h2>
        <div>
          <h3 className="text-lg font-medium">Is there only one H1 per page?</h3>
          <p className="text-muted-foreground">Yes. Supporting sections use H2/H3.</p>
        </div>
        <div>
          <h3 className="text-lg font-medium">Can I theme the components?</h3>
          <p className="text-muted-foreground">Yes, via CSS variables and provider props.</p>
        </div>
      </div>
    </div>
  );
}
