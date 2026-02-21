"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { ControlBar } from "@tambo-ai/ui-registry/components/control-bar";

export default function ControlBarPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Control Bar
        </h1>
        <p className="text-lg text-muted-foreground">
          A floating control bar component that provides quick access to chat
          functionality via keyboard shortcuts. Appears as a button in the
          bottom-right corner and can be triggered with Cmd+K (Mac) or Ctrl+K
          (Windows/Linux).
        </p>
      </header>

      {/* Examples Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Basic Usage"
            component={
              <div className="h-full w-full overflow-hidden bg-muted/20 p-8 flex flex-col gap-8">
                <div className="text-center space-y-4">
                  <h3 className="text-base font-500">Interactive Demo</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    The control bar appears as a floating button. Click the
                    button or press{" "}
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
                <div className="flex-1 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <ControlBar
                    triggerClassName="relative bottom-auto right-auto"
                    overlayClassName="bg-black/35 backdrop-blur-sm"
                  />
                </div>
              </div>
            }
            code={`import { ControlBar } from "@/components/tambo/control-bar";

export function ChatInterface() {
  return (
    <div className="relative min-h-screen p-8">
      <div className="flex-1 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
        <ControlBar
          triggerClassName="relative bottom-auto right-auto"
          overlayClassName="bg-black/35 backdrop-blur-sm"
        />
      </div>
    </div>
  );
}`}
            previewClassName="p-0"
            fullBleed
            minHeight={350}
            enableFullscreen
            fullscreenTitle="Control Bar"
          />
        </div>
      </section>

      {/* Installation */}
      <section>
        <InstallationSection cliCommand="npx tambo add control-bar" />
      </section>

      {/* Component API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">ControlBar</h3>

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
                <td>hotkey</td>
                <td>string</td>
                <td>&quot;mod+k&quot;</td>
                <td>
                  Keyboard shortcut for toggling the control bar (e.g.,
                  &quot;mod+k&quot;)
                </td>
              </tr>
              <tr>
                <td>variant</td>
                <td>
                  &quot;default&quot; | &quot;compact&quot; | &quot;solid&quot;
                </td>
                <td>&quot;default&quot;</td>
                <td>Visual style variant for messages in the thread</td>
              </tr>
              <tr>
                <td>className</td>
                <td>string</td>
                <td>-</td>
                <td>Additional CSS classes for customization</td>
              </tr>
              <tr>
                <td>triggerClassName</td>
                <td>string</td>
                <td>-</td>
                <td>Additional CSS classes for the trigger button</td>
              </tr>
              <tr>
                <td>overlayClassName</td>
                <td>string</td>
                <td>-</td>
                <td>Additional CSS classes for the modal overlay</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
