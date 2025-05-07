import { Graph } from "@/components/ui/graph";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const GraphChatInterface = () => {
  const userContextKey = useUserContextKey("graph-thread");
  const { registerComponent, thread } = useTambo();

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
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "The data structure for the graph.",
            properties: {
              type: {
                type: "string",
                enum: ["bar", "line", "pie"],
                description: "The type of graph to display.",
              },
              labels: {
                type: "array",
                description:
                  "Labels for the data points (e.g., x-axis categories).",
                items: { type: "string" },
              },
              datasets: {
                type: "array",
                description: "Array of datasets to plot on the graph.",
                items: {
                  type: "object",
                  properties: {
                    label: {
                      type: "string",
                      description: "Label for this dataset (used in legend).",
                    },
                    data: {
                      type: "array",
                      description: "Numerical data points for this dataset.",
                      items: { type: "number" },
                    },
                    color: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Color(s) for the dataset. Provide an array of colors (e.g., ['hsl(...)', 'hsl(...)']). For pie charts, each color corresponds to a slice. For bar/line charts, typically only the first color in the array is used.",
                    },
                  },
                  required: ["label", "data"],
                },
              },
            },
            required: ["type", "labels", "datasets"],
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
          title: {
            type: "string",
            description: "Optional title displayed above the graph.",
          },
          showLegend: {
            type: "boolean",
            description: "Whether to display the graph's legend.",
          },
          variant: {
            type: "string",
            enum: ["default", "solid", "bordered"],
            description: "Visual style variant of the graph container.",
            default: "default",
          },
          size: {
            type: "string",
            enum: ["default", "sm", "lg"],
            description: "Size variant of the graph.",
            default: "default",
          },
        },
        required: ["data"],
      },
    });
  }, [registerComponent, thread.id]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <MessageThreadFull contextKey={userContextKey} className="rounded-lg" />
    </div>
  );
};
