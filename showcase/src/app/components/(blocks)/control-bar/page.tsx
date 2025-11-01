"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { DemoControlBar } from "@/components/ui/control-bar";
import { useUserContextKey } from "@/lib/useUserContextKey";

export default function ControlBarPage() {
  const userContextKey = useUserContextKey("control-bar");

  return (
    <div className="prose max-w-full">
      {/* Title & Description */}
      <h1>Control Bar</h1>
      <p className="text-lg text-muted-foreground">
        A floating control bar component that provides quick access to chat
        functionality via keyboard shortcuts. Appears as a button in the
        bottom-right corner and can be triggered with Cmd+K (Mac) or Ctrl+K
        (Windows/Linux).
      </p>

      {/* Examples Section */}
      <h2 className="mt-12">Examples</h2>

      <ComponentCodePreview
        title="Basic Usage"
        component={
          <div className="h-full w-full relative bg-muted/20 flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-4 mb-8">
              <h3 className="text-base font-500">Interactive Demo</h3>
              <p className="text-muted-foreground max-w-md">
                The control bar appears as a floating button in the bottom-right
                corner. Click the button or press{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+K</kbd>{" "}
                (Mac) or{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd>{" "}
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
        }
        code={`import { DemoControlBar } from "@tambo-ai/react";

export function ChatInterface() {
  return (
    <div className="relative">
      {/* Your main content */}
      <div className="min-h-screen">
        <h1>Your App Content</h1>
      </div>

      {/* Control bar floats on top */}
      <DemoControlBar contextKey="demo" />
    </div>
  );
}`}
        previewClassName="p-0"
        fullBleed
        minHeight={650}
        enableFullscreen
        fullscreenTitle="Control Bar"
      />

      {/* Installation */}
      <InstallationSection cliCommand="npx tambo add control-bar" />

      {/* Component API */}
      <h2 className="mt-12">Component API</h2>

      <h3>DemoControlBar</h3>

      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>contextKey</td>
            <td>string</td>
            <td>-</td>
            <td>Unique identifier for the conversation thread</td>
          </tr>
          <tr>
            <td>className</td>
            <td>string</td>
            <td>-</td>
            <td>Additional CSS classes for customization</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
