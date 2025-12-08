"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import * as RechartsCore from "recharts";
import { z } from "zod/v3";

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
export type DashboardGraphDataType = z.infer<typeof graphDataSchema>;

// Extend the GraphProps with additional tambo properties
export interface DashboardGraphProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "data" | "title" | "size">,
    Omit<VariantProps<typeof graphVariants>, "size" | "variant"> {
  /** Data object containing chart configuration and values */
  data?: DashboardGraphDataType;
  /** Optional title for the chart */
  title?: string;
  /** Whether to show the legend (default: true) */
  showLegend?: boolean;
  /** Visual style variant of the graph */
  variant?: "default" | "solid" | "bordered";
  /** Size of the graph */
  size?: "default" | "sm" | "lg";
  /** Custom empty state configuration */
  emptyState?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
  };
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
export const DashboardGraph = React.forwardRef<
  HTMLDivElement,
  DashboardGraphProps
>(
  (
    {
      className,
      variant,
      size,
      data,
      title,
      showLegend = true,
      emptyState,
      ...props
    },
    ref,
  ) => {
    const dataIsValid =
      data?.labels &&
      data.datasets &&
      Array.isArray(data.labels) &&
      Array.isArray(data.datasets);

    // Check if data is empty (no data points)
    const hasData =
      dataIsValid &&
      data.datasets.some(
        (dataset) =>
          Array.isArray(dataset.data) &&
          dataset.data.some((value) => value > 0),
      );

    // Show loading state while generating
    if (!dataIsValid) {
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
              <span className="text-sm">
                {data ? "Data ready" : "Awaiting data"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Show empty state if no data
    if (!hasData && emptyState) {
      return (
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            {emptyState.icon && (
              <div className="items-center justify-center">
                {emptyState.icon}
              </div>
            )}
            {emptyState.title && (
              <p className="font-medium">{emptyState.title}</p>
            )}
            {emptyState.description && (
              <p className="text-sm text-center">{emptyState.description}</p>
            )}
          </div>
        </div>
      );
    }

    // If not generating and basic structure exists, proceed with detailed validation and rendering
    try {
      // Check for invalid data structure *only after* generation should be complete
      if (
        data.datasets.some(
          (dataset) =>
            !dataset.label ||
            !dataset.data ||
            !Array.isArray(dataset.data) ||
            dataset.data.length !== data.labels.length,
        )
      ) {
        console.error("Invalid graph data structure (post-generation):", data);
        // Render a specific error for invalid structure after completion
        return (
          <div
            ref={ref}
            className={cn(graphVariants({ variant, size }), className)}
            {...props}
          >
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-destructive text-center">
                <p className="font-medium">Invalid Graph Data</p>
                <p className="text-sm mt-1">
                  The final data structure is invalid.
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Transform data for Recharts (only if structure is valid post-generation)
      const chartData = data.labels.map((label, index) => ({
        name: label,
        ...Object.fromEntries(
          data.datasets.map((dataset) => [dataset.label, dataset.data[index]]),
        ),
      }));

      const renderChart = () => {
        if (!data.type || !["bar", "line", "pie"].includes(data.type)) {
          console.error("Invalid chart type:", data.type);
          return (
            <div className="h-full flex items-center justify-center">
              <div className="text-destructive text-center">
                <p className="font-medium">Error loading chart</p>
                <p className="text-sm mt-1">
                  Invalid chart type. Supported types are: bar, line, pie
                </p>
              </div>
            </div>
          );
        }

        switch (data.type) {
          case "bar":
            return (
              <RechartsCore.BarChart data={chartData}>
                <RechartsCore.XAxis
                  stroke="hsl(var(--muted-foreground))"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: string, index: number) =>
                    index === 0 || index === data.labels.length - 1 ? value : ""
                  }
                />
                <RechartsCore.YAxis
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, dx: -30 }}
                />
                <RechartsCore.Tooltip
                  cursor={{
                    fill: "hsl(var(--muted)/0.3)",
                    radius: 4,
                  }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                    fontSize: "12px",
                  }}
                />
                {showLegend && (
                  <RechartsCore.Legend
                    wrapperStyle={{
                      color: "hsl(var(--foreground))",
                    }}
                  />
                )}
                {data.datasets.map((dataset, index) => (
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
                <RechartsCore.XAxis
                  stroke="hsl(var(--muted-foreground))"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: string, index: number) =>
                    index === 0 || index === data.labels.length - 1 ? value : ""
                  }
                />
                <RechartsCore.YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12, dx: -30 }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsCore.Tooltip
                  cursor={{
                    stroke: "hsl(var(--muted))",
                    strokeWidth: 2,
                    strokeOpacity: 0.3,
                  }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                    fontSize: "12px",
                  }}
                />
                {showLegend && (
                  <RechartsCore.Legend
                    wrapperStyle={{
                      color: "hsl(var(--foreground))",
                    }}
                  />
                )}
                {data.datasets.map((dataset, index) => (
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

          case "pie":
            return (
              <RechartsCore.PieChart>
                <RechartsCore.Pie
                  data={data.datasets[0].data.map((value, index) => ({
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
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
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
      };

      return (
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-0 h-full">
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
                An error occurred while transforming data. Please try again
                later.
              </p>
            </div>
          </div>
        </div>
      );
    }
  },
);
DashboardGraph.displayName = "DashboardGraph";
