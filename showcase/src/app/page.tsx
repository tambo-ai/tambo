"use client";

import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
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
      <div className="bg-background flex justify-start items-center">
        <ShowcaseThemeProvider defaultTheme="light">
          <MessageThreadFull
            contextKey="main-demo"
            className="w-full max-w-3xl"
          />
        </ShowcaseThemeProvider>
      </div>
    </div>
  );
}
