"use client";

import { CLI } from "@/components/cli";
import { MessageThreadCollapsible } from "@/components/ui/message-thread-collapsible";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { DemoWrapper } from "../../demo-wrapper";

export default function MessageThreadCollapsiblePage() {
  const userContextKey = useUserContextKey("message-thread-collapsible");
  const installCommand = "npx tambo add message-thread-collapsible";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">
              Message Thread Collapsible
            </h1>
            <p className="text-lg text-secondary">
              A collapsible message thread component with chat history and input
              field.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <DemoWrapper title="Message Thread Collapsible">
            <div className="flex-1 bg-muted/20 flex flex-col gap-4 p-6 h-full relative">
              <div className="h-8 w-[200px] bg-muted/80 rounded-md" />
              <div className="h-4 w-[300px] bg-muted/80 rounded-md" />
              <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="h-32 bg-muted/80 rounded-lg" />
                <div className="h-32 bg-muted/80 rounded-lg" />
                <div className="h-32 bg-muted/80 rounded-lg" />
              </div>
              <div className="mt-4 h-4 w-[280px] bg-muted/80 rounded-md" />
              <div className="h-4 w-[320px] bg-muted/80 rounded-md" />
              <div className="flex-grow" />
              <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
              <div className="h-4 w-[200px] bg-muted/80 rounded-md" />
              <MessageThreadCollapsible
                defaultOpen={false}
                contextKey={userContextKey}
                className="absolute bottom-6 right-4"
              />
            </div>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
