import { Graph } from "@/components/ui/graph";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

export const GraphChatInterface = () => {
  const { registerComponent, thread } = useTambo();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    registerComponent({
      name: "Graph",
      description: `A versatile data visualization component that supports multiple chart types.
      It can create bar charts, line charts, and pie charts with customizable styles and layouts.
      The component handles data formatting, legends, tooltips, and responsive sizing.
      
      IMPORTANT: The data structure must always include both 'labels' and 'datasets' arrays.
      - labels: An array of strings for the x-axis or categories
      - datasets: An array of objects, each with a 'label' and 'data' array
      - The length of each dataset's 'data' array must match the length of the 'labels' array

      Example data structure:
      {
        type: "bar",
        labels: ["Jan", "Feb", "Mar"], // Required array of strings
        datasets: [                    // Required array of datasets
          {
            label: "Sales",           // Required string
            data: [30, 45, 60]       // Required array of numbers (same length as labels)
          }
        ]
      }

      Features:
      - Multiple chart types (bar, line, pie)
      - Customizable colors and styles
      - Interactive tooltips
      - Responsive design
      - Legend support
      - Dark mode support
      
      Example use cases:
      - Sales data visualization
      - Analytics dashboards
      - Performance metrics
      - Trend analysis
      - Data comparisons
      
      Usage tips:
      1. Use bar charts for comparing categories
      2. Use line charts for trends over time
      3. Use pie charts for showing proportions (best with 2-5 values)
      4. When switching chart types, keep the same data structure`,
      component: Graph,
      propsDefinition: {
        data: {
          type: "object",
          properties: {
            type: {
              type: "enum",
              options: ["bar", "line", "pie"],
            },
            labels: {
              type: "array",
              items: "string",
            },
            datasets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: "string",
                  data: {
                    type: "array",
                    items: "number",
                  },
                  color: "string?",
                },
              },
            },
          },
          example: [
            {
              description: "Bar chart example - Sales and Revenue Comparison",
              data: {
                type: "bar",
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [
                  {
                    label: "Sales",
                    data: [65, 59, 80, 81, 56, 72],
                    color: "hsl(210, 100.00%, 61.60%)",
                  },
                  {
                    label: "Revenue",
                    data: [28, 48, 40, 19, 86, 27],
                    color: "hsl(150, 100.00%, 61.60%)",
                  },
                  {
                    label: "Profit",
                    data: [17, 22, 28, 11, 45, 13],
                    color: "hsl(45, 100.00%, 61.60%)",
                  },
                ],
              },
              title: "Quarterly Performance",
              variant: "bordered",
              size: "lg",
            },
            {
              description: "Line chart example - Monthly Trends",
              data: {
                type: "line",
                labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
                datasets: [
                  {
                    label: "Website Traffic",
                    data: [1200, 1900, 3000, 4900, 2600],
                    color: "hsl(280, 100.00%, 61.60%)",
                  },
                  {
                    label: "Conversion Rate",
                    data: [12, 19, 27, 30, 24],
                    color: "hsl(340, 100.00%, 61.60%)",
                  },
                ],
              },
              title: "Website Analytics",
              variant: "solid",
              size: "lg",
            },
            {
              description: "Pie chart example - Market Share",
              data: {
                type: "pie",
                labels: ["Product A", "Product B", "Product C", "Product D"],
                datasets: [
                  {
                    label: "Market Share",
                    data: [45, 25, 20, 10],
                    color: [
                      "hsl(210, 100.00%, 61.60%)",
                      "hsl(150, 100.00%, 61.60%)",
                      "hsl(45, 100.00%, 61.60%)",
                      "hsl(280, 100.00%, 61.60%)",
                    ],
                  },
                ],
              },
              title: "Product Market Distribution",
              variant: "default",
              size: "lg",
            },
          ],
        },
        title: "string?",
        showLegend: "boolean?",
        variant: {
          type: "enum",
          options: ["default", "solid", "bordered"],
          optional: true,
        },
        size: {
          type: "enum",
          options: ["default", "sm", "lg"],
          optional: true,
        },
      },
    });
  }, [registerComponent, thread]);

  return (
    <div className="relative h-full w-full">
      <MessageThreadFull contextKey="graph-thread" />
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Example Prompt</h3>
        <div className="relative">
          <pre className="text-sm bg-white p-3 rounded-md overflow-x-auto">
            {`Create a bar chart for quarterly sales:
- Title: "Quarterly Sales"
- Labels: Q1, Q2, Q3, Q4
- Datasets:
  - Revenue: 120K, 150K, 180K, 200K
  - Expenses: 80K, 95K, 110K, 125K
- Bordered variant, large size
- Show legend`}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(
                  `Create a bar chart for quarterly sales:
- Title: "Quarterly Sales"
- Labels: Q1, Q2, Q3, Q4
- Datasets:
  - Revenue: 120K, 150K, 180K, 200K
  - Expenses: 80K, 95K, 110K, 125K
- Bordered variant, large size
- Show legend`,
                )
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
            }}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
