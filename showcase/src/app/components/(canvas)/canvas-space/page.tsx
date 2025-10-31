"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { CanvasChatInterface } from "@/components/generative/CanvasChatInterface";

export default function CanvasSpacePage() {
  return (
    <div className="prose max-w-full">
      <h1>Canvas Space</h1>
      <p className="text-lg text-muted-foreground">
        A dedicated area that dynamically displays interactive UI components
        generated within a Tambo chat thread. It automatically updates to show
        the latest generated component and clears when switching threads.
      </p>

      <h2 className="mt-12">Example</h2>

      <ComponentCodePreview
        component={<CanvasChatInterface />}
        code={`import { CanvasSpace } from "@tambo-ai/react";

export function CanvasDemo() {
  return (
    <CanvasSpace contextKey="my-thread" />
  );
}`}
        previewClassName="p-0"
        fullBleed
        minHeight={650}
      />

      <InstallationSection cliCommand="npx tambo add canvas-space" />

      <h2 className="mt-12">Component API</h2>

      <h3>CanvasSpace</h3>

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
  );
}
