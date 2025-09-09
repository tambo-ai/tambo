"use client";

import { CLI } from "@/components/cli";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { DemoWrapper } from "../../demo-wrapper";

export default function MessageThreadFullPage() {
  const userContextKey = useUserContextKey("message-thread-full");
  const installCommand = "npx tambo add message-thread-full";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Message Thread Full</h1>
            <p className="text-lg text-secondary">
              A full message thread component with chat history and input field.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <h2 className="text-xl font-semibold">Examples</h2>
          <h3 className="text-lg font-medium mb-3">Live Demo</h3>
          <DemoWrapper title="Message Thread Full" hidePreviewHeading>
            <div className="h-full relative flex flex-col rounded-lg overflow-hidden">
              <MessageThreadFull
                contextKey={userContextKey}
                className="w-full rounded-lg"
              />
            </div>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
