"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { ArrowLeft, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function StarterPage() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              Starter Component Demo
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
            <Lightbulb className="w-4 h-4" />
            <span>Try asking: "Show me some jewelry"</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col relative">
          <div className="absolute inset-0 overflow-hidden">
            <MessageThreadFull />
          </div>
        </main>
      </div>
    </TamboProvider>
  );
}
