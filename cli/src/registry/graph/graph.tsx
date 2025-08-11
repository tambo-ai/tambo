"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import * as RechartsCore from "recharts";
import { z } from "zod";

/**
 * Represents a graph data object
 * @property {string} type - Type of graph to render
 * @property {string[]} labels - Labels for the graph
 * @property {Object[]} datasets - Data for the graph
 */

export const graphDataSchema = z.object({
  type: z.enum(["bar", "line", "pie"]).describe("Type of graph to render"),
  labels: z.array(z.string()).describe("Labels for the graph"),
  datasets: z
    .array(
      z.object({
        label: z.string().describe("Label for the dataset"),
        data: z.array(z.number()).describe("Data points for the dataset"),
        color: z.string().optional().describe("Optional color for the dataset"),
      }),
    )
    .describe("Data for the graph"),
});

export const graphSchema = z.object({
  data: graphDataSchema.describe(
    "Data object containing chart configuration and values",
  ),
  title: z.string().describe("Title for the chart"),
  showLegend: z
    .boolean()
    .optional()
    .describe("Whether to show the legend (default: true)"),
  variant: z
    .enum(["default", "solid", "bordered"])
    .optional()
    .describe("Visual style variant of the graph"),
  size: z
    .enum(["default", "sm", "lg"])
    .optional()
    .describe("Size of the graph"),
});

// Define the base type from the Zod schema
export type GraphDataType = z.infer<typeof graphDataSchema>;

// Extend the GraphProps with additional tambo properties
export interface GraphProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "data" | "title" | "size">,
    Omit<VariantProps<typeof graphVariants>, "size" | "variant"> {
  /** Data object containing chart configuration and values */
  data?: GraphDataType;
  /** Optional title for the chart */
  title?: string;
  /** Whether to show the legend (default: true) */
  showLegend?: boolean;
  /** Visual style variant of the graph */
  variant?: "default" | "solid" | "bordered";
  /** Size of the graph */
  size?: "default" | "sm" | "lg";
}

const graphVariants = cva(
  "w-full rounded-lg overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background",
        solid: [
          "shadow-lg shadow-zinc-900/10 dark:shadow-zinc-900/20",
          "bg-muted",
        ].join(" "),
        bordered: ["border-2", "border-border"].join(" "),
      },
      size: {
        default: "h-64",
        sm: "h-48",
        lg: "h-96",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const defaultColors = [
  "hsl(220, 100%, 62%)", // Blue
  "hsl(160, 82%, 47%)", // Green
  "hsl(32, 100%, 62%)", // Orange
  "hsl(340, 82%, 66%)", // Pink
];

/**
 * A component that renders various types of charts using Recharts
 * @component
 * @example
 * ```tsx
 * <Graph
 *   data={{
 *     type: "bar",
 *     labels: ["Jan", "Feb", "Mar"],
 *     datasets: [{
 *       label: "Sales",
 *       data: [100, 200, 300]
 *     }]
 *   }}
 *   title="Monthly Sales"
 *   variant="solid"
 *   size="lg"
 *   className="custom-styles"
 * />
 * ```
 */
export const Graph = React.forwardRef<HTMLDivElement, GraphProps>(
  (
    { className, variant, size, data, title, showLegend = true, ...props },
    ref,
  ) => {
    // If no data received yet, show loading
    if (!data) {
      return (
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-4 h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="flex items-center gap-1 h-4">
                <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
              </div>
              <span className="text-sm">Awaiting data...</span>
            </div>
          </div>
        </div>
      );
    }

    // Check if we have the minimum viable data structure
    const hasValidStructure =
      data.type &&
      data.labels &&
      data.datasets &&
      Array.isArray(data.labels) &&
      Array.isArray(data.datasets) &&
      data.labels.length > 0 &&
      data.datasets.length > 0;

    if (!hasValidStructure) {
      return (
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-4 h-full flex items-center justify-center">
            <div className="text-muted-foreground text-center">
              <p className="text-sm">Building chart...</p>
            </div>
          </div>
        </div>
      );
    }

    try {
      // Filter datasets to only include those with valid data
      const validDatasets = data.datasets.filter(
        (dataset) =>
          dataset.label &&
          dataset.data &&
          Array.isArray(dataset.data) &&
          dataset.data.length > 0,
      );

      if (validDatasets.length === 0) {
        return (
          <div
            ref={ref}
            className={cn(graphVariants({ variant, size }), className)}
            {...props}
          >
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-muted-foreground text-center">
                <p className="text-sm">Preparing datasets...</p>
              </div>
            </div>
          </div>
        );
      }

      // Use the minimum length between labels and the shortest dataset
      const maxDataPoints = Math.min(
        data.labels.length,
        Math.min(...validDatasets.map((d) => d.data.length)),
      );

      // Transform data for Recharts using only available data points
      const chartData = data.labels
        .slice(0, maxDataPoints)
        .map((label, index) => ({
          name: label,
          ...Object.fromEntries(
            validDatasets.map((dataset) => [
              dataset.label,
              dataset.data[index] ?? 0,
            ]),
          ),
        }));

      const renderChart = () => {
        if (!["bar", "line", "pie"].includes(data.type)) {
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-muted-foreground text-center">
                <p className="text-sm">Unsupported chart type: {data.type}</p>
              </div>
            </div>
          );
        }

        switch (data.type) {
          case "bar":
            return (
              <RechartsCore.BarChart data={chartData}>
                <RechartsCore.CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <RechartsCore.XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsCore.YAxis
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsCore.Tooltip
                  cursor={{
                    fill: "hsl(var(--muted-foreground))",
                    fillOpacity: 0.1,
                    radius: 4,
                  }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                  }}
                />
                {showLegend && (
                  <RechartsCore.Legend
                    wrapperStyle={{
                      color: "hsl(var(--foreground))",
                    }}
                  />
                )}
                {validDatasets.map((dataset, index) => (
                  <RechartsCore.Bar
                    key={dataset.label}
                    dataKey={dataset.label}
                    fill={
                      dataset.color ??
                      defaultColors[index % defaultColors.length]
                    }
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </RechartsCore.BarChart>
            );

          case "line":
            return (
              <RechartsCore.LineChart data={chartData}>
                <RechartsCore.CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <RechartsCore.XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsCore.YAxis
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsCore.Tooltip
                  cursor={{
                    stroke: "hsl(var(--muted))",
                    strokeWidth: 2,
                    strokeOpacity: 0.3,
                  }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                  }}
                />
                {showLegend && (
                  <RechartsCore.Legend
                    wrapperStyle={{
                      color: "hsl(var(--foreground))",
                    }}
                  />
                )}
                {validDatasets.map((dataset, index) => (
                  <RechartsCore.Line
                    key={dataset.label}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={
                      dataset.color ??
                      defaultColors[index % defaultColors.length]
                    }
                    dot={false}
                  />
                ))}
              </RechartsCore.LineChart>
            );

          case "pie": {
            // For pie charts, use the first valid dataset
            const pieDataset = validDatasets[0];
            if (!pieDataset) {
              return (
                <div className="h-full flex items-center justify-center">
                  <div className="text-muted-foreground text-center">
                    <p className="text-sm">No valid dataset for pie chart</p>
                  </div>
                </div>
              );
            }

            return (
              <RechartsCore.PieChart>
                <RechartsCore.Pie
                  data={pieDataset.data
                    .slice(0, maxDataPoints)
                    .map((value, index) => ({
                      name: data.labels[index],
                      value,
                      fill: defaultColors[index % defaultColors.length],
                    }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                />
                <RechartsCore.Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))",
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                  }}
                />
                {showLegend && (
                  <RechartsCore.Legend
                    wrapperStyle={{
                      color: "hsl(var(--foreground))",
                    }}
                  />
                )}
              </RechartsCore.PieChart>
            );
          }
        }
      };

      return (
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-4 h-full">
            {title && (
              <h3 className="text-lg font-medium mb-4 text-foreground">
                {title}
              </h3>
            )}
            <div className="w-full h-[calc(100%-2rem)]">
              <RechartsCore.ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </RechartsCore.ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering chart:", error);
      return (
        <div
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-4 flex items-center justify-center h-full">
            <div className="text-destructive text-center">
              <p className="font-medium">Error loading chart</p>
              <p className="text-sm mt-1">
                An error occurred while rendering. Please try again.
              </p>
            </div>
          </div>
        </div>
      );
    }
  },
);
Graph.displayName = "Graph";
