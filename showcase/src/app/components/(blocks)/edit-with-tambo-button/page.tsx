"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { EditWithTamboInterface } from "@/components/generative/EditWithTamboInterface";
import { InstallationSection } from "@/components/installation-section";

export default function EditWithTamboButtonPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Edit with Tambo Button
        </h1>
        <p className="text-lg text-muted-foreground">
          An inline editing button that appears on interactable components.
          Opens a popover with a prompt input to edit the component using
          natural language. You can also choose to send the edit in a thread.
        </p>
      </header>

      {/* Examples Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <p className="text-sm text-muted-foreground">
          This interactive demo runs inside the showcase&apos;s app-level
          TamboProvider, which sets a per-user context key (persisted in
          localStorage).
        </p>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Basic Usage"
            component={<EditWithTamboInterface />}
            code={`import { EditWithTamboButton } from "@/components/tambo/edit-with-tambo-button";
import { withInteractable } from "@tambo-ai/react";
import { z } from "zod";

function MyCardBase({ title, description }) {
  return (
    <div className="p-6 border rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <EditWithTamboButton />
      </div>
    </div>
  );
}

const MyCard = withInteractable(MyCardBase, {
  componentName: "MyCard",
  propsSchema: z.object({
    title: z.string().describe("The card title"),
    description: z.string().describe("The card description"),
  }),
});

export function App() {
  return <MyCard title="Welcome" description="Edit me!" />;
}`}
            previewClassName="p-0"
            fullBleed
            minHeight={800}
            enableFullscreen
            fullscreenTitle="Edit with Tambo Button"
          />
        </div>
      </section>

      {/* Installation */}
      <section>
        <InstallationSection cliCommand="npx tambo add edit-with-tambo-button" />
      </section>

      {/* Component API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">EditWithTamboButton</h3>

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
                <td>icon</td>
                <td>React.ReactNode</td>
                <td>Bot icon</td>
                <td>Custom icon component to display</td>
              </tr>
              <tr>
                <td>tooltip</td>
                <td>string</td>
                <td>&quot;Edit with tambo&quot;</td>
                <td>Tooltip text shown on hover</td>
              </tr>
              <tr>
                <td>description</td>
                <td>string</td>
                <td>-</td>
                <td>
                  Description for tooltip (falls back to component description)
                </td>
              </tr>
              <tr>
                <td>className</td>
                <td>string</td>
                <td>-</td>
                <td>Additional CSS classes for the button</td>
              </tr>
              <tr>
                <td>onOpenThread</td>
                <td>() =&gt; void</td>
                <td>-</td>
                <td>
                  Optional callback to open the thread panel/chat interface
                </td>
              </tr>
              <tr>
                <td>editorRef</td>
                <td>React.MutableRefObject&lt;Editor | null&gt;</td>
                <td>-</td>
                <td>
                  Optional TextEditor editor ref for &quot;Send in Thread&quot;
                  mode
                </td>
              </tr>
              <tr>
                <td>suggestions</td>
                <td>Suggestion[]</td>
                <td>-</td>
                <td>
                  Optional suggestions to display when using &quot;Send in
                  Thread&quot;
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Usage Notes */}
      <section className="space-y-4 not-prose">
        <h2 className="text-2xl font-semibold">Usage Notes</h2>
        <ul className="space-y-3 list-none">
          <li className="flex gap-3">
            <div>
              <strong className="font-semibold">
                Requires withInteractable
              </strong>
              <p className="text-sm text-muted-foreground mt-1">
                This component must be used within a component wrapped with{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  withInteractable
                </code>
                . It reads the current interactable context to send edit
                instructions to Tambo.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <div>
              <strong className="font-semibold">Two Send Modes</strong>
              <p className="text-sm text-muted-foreground mt-1">
                The button supports two modes: &quot;Send&quot; (inline edit)
                and &quot;Send in Thread&quot; (opens in chat panel). Users can
                choose via the dropdown.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
