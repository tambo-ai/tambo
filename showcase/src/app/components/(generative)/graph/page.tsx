"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { GraphChatInterface } from "@/components/generative/GraphChatInterface";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import { Graph } from "@tambo-ai/ui-registry/components/graph";

export default function GraphPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Graph
        </h1>
        <p className="text-lg text-muted-foreground">
          A versatile data visualization component that supports bar charts,
          line charts, and pie charts with customizable styles. Perfect for
          displaying analytics, trends, and comparative data.
        </p>
      </header>

      {/* Example Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Example</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Quarterly Sales Chart"
            component={
              <Graph
                title="Quarterly Sales"
                data={{
                  type: "bar",
                  labels: ["Q1", "Q2", "Q3", "Q4"],
                  datasets: [
                    {
                      label: "Revenue",
                      data: [120000, 150000, 180000, 200000],
                      color: "hsl(160, 82%, 47%)",
                    },
                    {
                      label: "Expenses",
                      data: [80000, 95000, 110000, 125000],
                      color: "hsl(340, 82%, 66%)",
                    },
                  ],
                }}
                variant="bordered"
                size="lg"
                showLegend={true}
              />
            }
            code={`import { Graph } from "@/components/tambo/graph";

export function QuarterlySalesChart() {
  return (
    <Graph
      title="Quarterly Sales"
      data={{
        type: "bar",
        labels: ["Q1", "Q2", "Q3", "Q4"],
        datasets: [
          {
            label: "Revenue",
            data: [120000, 150000, 180000, 200000],
            color: "hsl(160, 82%, 47%)",
          },
          {
            label: "Expenses",
            data: [80000, 95000, 110000, 125000],
            color: "hsl(340, 82%, 66%)",
          },
        ],
      }}
      variant="bordered"
      size="lg"
      showLegend={true}
    />
  );
}`}
            previewClassName="p-8"
          />
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Interactive Demo</h2>

        <p className="text-sm text-muted-foreground">
          Use natural language to generate and modify charts in real time. This
          interactive demo runs inside the showcase&apos;s app-level
          TamboProvider, which sets a per-user context key (persisted in
          localStorage).
        </p>

        <div className="space-y-6">
          <ComponentCodePreview
            title="AI-Generated Chart"
            component={<GraphChatInterface />}
            code={`import { Graph, graphSchema } from "@/components/tambo/graph";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export function GraphDemo() {
  const { registerComponent } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "Graph",
      description: "A versatile data visualization component.",
      component: Graph,
      propsSchema: graphSchema,
    });
  }, [registerComponent]);

  return <MessageThreadFull />;
}`}
            previewClassName="p-0"
            minHeight={700}
          />
        </div>
      </section>

      {/* Installation */}
      <section>
        <InstallationSection cliCommand="npx tambo add graph" />
      </section>

      {/* Try It Yourself */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Try It Yourself</h2>

        <div className="not-prose space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              1. Install the component
            </h3>
            <pre className="rounded-md border border-border bg-muted/40 p-4">
              <code className="text-sm text-foreground">
                npx tambo add graph
              </code>
            </pre>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              2. Register with Tambo
            </h3>
            <SyntaxHighlighter
              language="tsx"
              code={`import { Graph, graphSchema } from "@/components/tambo/graph";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export function App() {
  const { registerComponent } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "Graph",
      description: "A versatile data visualization component.",
      component: Graph,
      propsSchema: graphSchema,
    });
  }, [registerComponent]);

  return <MessageThreadFull />;
}`}
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              3. Send a prompt
            </h3>
            <p className="text-sm text-muted-foreground">
              Try these example prompts:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                &rarr; &quot;Create a bar chart of monthly revenue for Q1&quot;
              </li>
              <li>
                &rarr; &quot;Show a line chart comparing signups vs activations
                over 6 months&quot;
              </li>
              <li>
                &rarr; &quot;Make a pie chart of traffic sources: organic, paid,
                and referral&quot;
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Component API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Graph</h3>

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
                  <td>data</td>
                  <td>GraphData</td>
                  <td>-</td>
                  <td>
                    Data object containing chart type, labels, and datasets
                  </td>
                </tr>
                <tr>
                  <td>title</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Chart title displayed above the graph</td>
                </tr>
                <tr>
                  <td>showLegend</td>
                  <td>boolean</td>
                  <td>true</td>
                  <td>Whether to display the legend</td>
                </tr>
                <tr>
                  <td>variant</td>
                  <td>
                    &quot;default&quot; | &quot;solid&quot; |
                    &quot;bordered&quot;
                  </td>
                  <td>&quot;default&quot;</td>
                  <td>Visual style of the graph container</td>
                </tr>
                <tr>
                  <td>size</td>
                  <td>&quot;default&quot; | &quot;sm&quot; | &quot;lg&quot;</td>
                  <td>&quot;default&quot;</td>
                  <td>Height of the graph container</td>
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

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">GraphData</h3>

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
                  <td>type</td>
                  <td>&quot;bar&quot; | &quot;line&quot; | &quot;pie&quot;</td>
                  <td>-</td>
                  <td>Type of chart to render</td>
                </tr>
                <tr>
                  <td>labels</td>
                  <td>string[]</td>
                  <td>-</td>
                  <td>Array of labels for the x-axis</td>
                </tr>
                <tr>
                  <td>datasets</td>
                  <td>
                    {"{"} label: string; data: number[]; color?: string {"}"}[]
                  </td>
                  <td>-</td>
                  <td>
                    Array of dataset objects with label, data points, and
                    optional color
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
