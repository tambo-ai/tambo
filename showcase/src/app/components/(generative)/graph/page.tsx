"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { GraphChatInterface } from "@/components/generative/GraphChatInterface";
import { TamboProvider } from "@tambo-ai/react";

export default function GraphPage() {
  return (
    <div className="prose max-w-full">
      {/* Title & Description */}
      <h1>Graph</h1>
      <p className="text-lg text-muted-foreground">
        A versatile data visualization component that supports bar charts, line
        charts, and pie charts with customizable styles. Perfect for displaying
        analytics, trends, and comparative data.
      </p>

      {/* Examples Section */}
      <h2 className="mt-12">Examples</h2>

      <ComponentCodePreview
        title="Quarterly Sales Chart"
        component={
          <TamboProvider
            apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
            tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
          >
            <GraphChatInterface />
          </TamboProvider>
        }
        code={`import { Graph } from "@tambo-ai/react";

export function QuarterlySalesChart() {
  return (
    <Graph
      title="Quarterly Sales"
      type="bar"
      labels={["Q1", "Q2", "Q3", "Q4"]}
      datasets={[
        {
          label: "Revenue",
          data: [120000, 150000, 180000, 200000],
          backgroundColor: "rgba(75, 192, 192, 0.6)"
        },
        {
          label: "Expenses",
          data: [80000, 95000, 110000, 125000],
          backgroundColor: "rgba(255, 99, 132, 0.6)"
        }
      ]}
      variant="bordered"
      size="large"
      showLegend={true}
    />
  );
}`}
        previewClassName="p-8 min-h-[600px]"
      />

      {/* Installation */}
      <InstallationSection cliCommand="npx tambo add graph" />

      {/* Component API */}
      <h2 className="mt-12">Component API</h2>

      <h3>Graph</h3>

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
            <td>title</td>
            <td>string</td>
            <td>-</td>
            <td>Chart title displayed above the graph</td>
          </tr>
          <tr>
            <td>description</td>
            <td>string</td>
            <td>-</td>
            <td>Optional description text below the title</td>
          </tr>
          <tr>
            <td>type</td>
            <td>&quot;bar&quot; | &quot;line&quot; | &quot;pie&quot;</td>
            <td>&quot;bar&quot;</td>
            <td>Type of chart to render</td>
          </tr>
          <tr>
            <td>labels</td>
            <td>string[]</td>
            <td>[]</td>
            <td>Array of labels for the x-axis</td>
          </tr>
          <tr>
            <td>datasets</td>
            <td>Dataset[]</td>
            <td>[]</td>
            <td>Array of dataset configurations</td>
          </tr>
          <tr>
            <td>variant</td>
            <td>&quot;solid&quot; | &quot;bordered&quot;</td>
            <td>&quot;solid&quot;</td>
            <td>Visual style of the graph container</td>
          </tr>
          <tr>
            <td>size</td>
            <td>&quot;small&quot; | &quot;medium&quot; | &quot;large&quot;</td>
            <td>&quot;medium&quot;</td>
            <td>Height of the graph container</td>
          </tr>
          <tr>
            <td>showLegend</td>
            <td>boolean</td>
            <td>true</td>
            <td>Whether to display the legend</td>
          </tr>
          <tr>
            <td>className</td>
            <td>string</td>
            <td>-</td>
            <td>Additional CSS classes for customization</td>
          </tr>
        </tbody>
      </table>

      <h3>Dataset</h3>

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
            <td>label</td>
            <td>string</td>
            <td>-</td>
            <td>Dataset label shown in the legend</td>
          </tr>
          <tr>
            <td>data</td>
            <td>number[]</td>
            <td>[]</td>
            <td>Array of data values</td>
          </tr>
          <tr>
            <td>backgroundColor</td>
            <td>string | string[]</td>
            <td>-</td>
            <td>Background color(s) for data points</td>
          </tr>
          <tr>
            <td>borderColor</td>
            <td>string</td>
            <td>-</td>
            <td>Border color for data points (line charts)</td>
          </tr>
          <tr>
            <td>borderWidth</td>
            <td>number</td>
            <td>1</td>
            <td>Border width for data points</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
