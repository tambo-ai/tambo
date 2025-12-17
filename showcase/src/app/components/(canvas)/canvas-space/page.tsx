"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { CanvasChatInterface } from "@/components/generative/CanvasChatInterface";

export default function CanvasSpacePage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Canvas Space
        </h1>
        <p className="text-lg text-muted-foreground">
          A dedicated area that dynamically displays interactive UI components
          generated within a Tambo chat thread. It automatically updates to show
          the latest generated component and clears when switching threads.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Example</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            component={<CanvasChatInterface />}
            code={`import { CanvasSpace } from "@/components/tambo/canvas-space";

export function CanvasDemo() {
  return <CanvasSpace contextKey="my-thread" />;
}`}
            previewClassName="p-0"
            fullBleed
            minHeight={650}
          />
        </div>
      </section>

      <section>
        <InstallationSection cliCommand="npx tambo add canvas-space" />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">CanvasSpace</h3>

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
                <td className="text-muted-foreground">
                  The context key identifying which thread to display generated
                  components from
                </td>
              </tr>
              <tr>
                <td>className</td>
                <td>string</td>
                <td>-</td>
                <td className="text-muted-foreground">
                  Optional CSS class names to apply custom styling to the canvas
                  container
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
