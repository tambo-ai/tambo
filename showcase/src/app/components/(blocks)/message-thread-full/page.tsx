"use client";

import { CLI } from "@/components/cli";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";

export default function MessageThreadFullPage() {
  const installCommand = "npx tambo add message-thread-full";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Message Thread Full</h1>
            <p className="text-lg text-secondary mb-6">
              A full message thread component with chat history and input field.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preview</h2>
            <div className="rounded-lg bg-background p-6 border border-border/40">
              <div className="h-[600px] relative flex rounded-lg shadow-lg overflow-hidden">
                <MessageThreadFull
                  contextKey="message-thread-full"
                  className="w-full rounded-lg"
                  style={{ height: "100%" }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
