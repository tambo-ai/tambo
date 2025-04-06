"use client";

import { CLI } from "@/components/cli";
import { MessageThreadPanel } from "@/components/ui/message-thread-panel";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";

export default function MessageThreadPanelPage() {
  const installCommand = "npx tambo add message-thread-panel";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">MessageThreadPanel</h1>
            <p className="text-lg text-muted-foreground mb-6">
              A sidebar-style message thread component with chat history and
              input field.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preview</h2>
            <div className="rounded-lg bg-background p-6 border border-border/40">
              <div className="h-[600px] relative flex rounded-lg shadow-lg">
                <div className="flex-1 bg-muted/20 flex flex-col gap-4 p-6">
                  <div className="h-8 w-[200px] bg-muted/80 rounded-md" />
                  <div className="h-4 w-[300px] bg-muted/80 rounded-md" />
                  <div className="h-4 w-[250px] bg-muted/80 rounded-md" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="h-32 bg-muted/80 rounded-lg" />
                    <div className="h-32 bg-muted/80 rounded-lg" />
                  </div>
                </div>
                <MessageThreadPanel
                  className="w-[400px] relative"
                  contextKey="message-thread-panel"
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
