"use client";

import { CLI } from "@/components/cli";
import { DemoControlBar } from "@/components/ui/control-bar";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import * as React from "react";
import { DemoWrapper } from "../../demo-wrapper";

export default function ControlBarPage() {
  const userContextKey = useUserContextKey("control-bar");
  const installCommand = "npx tambo add control-bar";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Control Bar</h1>
            <p className="text-lg text-secondary">
              A floating control bar component that provides quick access to
              chat functionality via keyboard shortcuts.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <DemoWrapper title="Control Bar Demo">
            <div className="h-full relative bg-muted/20 flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-4 mb-8">
                <h3 className="text-xl font-semibold">Interactive Demo</h3>
                <p className="text-muted-foreground max-w-md">
                  The control bar appears as a floating button in the
                  bottom-right corner. Click the button or press{" "}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">
                    Cmd+K
                  </kbd>{" "}
                  (Mac) or{" "}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">
                    Ctrl+K
                  </kbd>{" "}
                  (Windows/Linux) to open it.
                </p>
              </div>

              <div className="flex-1 w-full bg-background/50 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Main content area - the control bar floats above this content
                </p>
              </div>

              <DemoControlBar contextKey={userContextKey} />
            </div>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
