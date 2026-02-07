"use client";

import {
  Graph as GraphBase,
  type GraphChartRenderProps,
  type GraphLoadingStatus,
} from "@tambo-ai/react-ui-base/graph";
import { cn } from "@tambo-ai/ui-registry/utils";
import { cva } from "class-variance-authority";
import * as React from "react";
import * as RechartsCore from "recharts";
import { z } from "zod/v3";

/**
 * Variants for the Graph component
 */
export const graphVariants = cva(
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

/**
 * Zod schema for GraphData
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

/**
 * Zod schema for Graph
 */
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
  className: z
    .string()
    .optional()
    .describe("Additional CSS classes for styling"),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type GraphProps = z.infer<typeof graphSchema>;

/**
 * TypeScript type inferred from the Zod schema
 */
export type GraphDataType = z.infer<typeof graphDataSchema>;

/**
 * Default colors for the Graph component.
 *
 * Color handling: our v4 theme defines CSS variables like `--border`,
 * `--muted-foreground`, and `--chart-1` as full OKLCH color values in
 * `globals-v4.css`, so we pass them directly as `var(--token)` to
 * Recharts/SVG props instead of wrapping them in `hsl()`/`oklch()`.
 */
const defaultColors = [
  "hsl(220, 100%, 62%)", // Blue
  "hsl(160, 82%, 47%)", // Green
  "hsl(32, 100%, 62%)", // Orange
  "hsl(340, 82%, 66%)", // Pink
];

/**
 * Maps loading status to user-facing messages.
 * @param status - The loading status from the base component
 * @returns The display message for the given status
 */
function getLoadingMessage(status: GraphLoadingStatus): string {
  switch (status) {
    case "no-data":
      return "Awaiting data...";
    case "invalid-structure":
      return "Building chart...";
    case "no-valid-datasets":
      return "Preparing datasets...";
  }
}

/**
 * Styled loading indicator for the graph component.
 * Renders bouncing dots animation for "no-data" status, or a text message for other states.
 * @returns The loading indicator UI
 */
function GraphLoadingIndicator() {
  return (
    <GraphBase.Loading className="p-4 h-full flex items-center justify-center">
      {({ status }) => {
        if (status === "no-data") {
          return (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="flex items-center gap-1 h-4">
                <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.2s]" />
                <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.1s]" />
              </div>
              <span className="text-sm">{getLoadingMessage(status)}</span>
            </div>
          );
        }

        return (
          <div className="text-muted-foreground text-center">
            <p className="text-sm">{getLoadingMessage(status)}</p>
          </div>
        );
      }}
    </GraphBase.Loading>
  );
}

/**
 * Renders a bar chart using Recharts.
 * @returns The Recharts BarChart element
 */
function BarChartRenderer({
  chartData,
  validDatasets,
  showLegend,
}: Pick<GraphChartRenderProps, "chartData" | "validDatasets" | "showLegend">) {
  return (
    <RechartsCore.BarChart data={chartData}>
      <RechartsCore.CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        stroke="var(--border)"
      />
      <RechartsCore.XAxis
        dataKey="name"
        stroke="var(--muted-foreground)"
        axisLine={false}
        tickLine={false}
      />
      <RechartsCore.YAxis
        stroke="var(--muted-foreground)"
        axisLine={false}
        tickLine={false}
      />
      <RechartsCore.Tooltip
        cursor={{
          fill: "var(--muted-foreground)",
          fillOpacity: 0.1,
          radius: 4,
        }}
        contentStyle={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "var(--radius)",
          color: "var(--foreground)",
        }}
      />
      {showLegend && (
        <RechartsCore.Legend
          wrapperStyle={{
            color: "var(--foreground)",
          }}
        />
      )}
      {validDatasets.map((dataset, index) => (
        <RechartsCore.Bar
          key={dataset.label}
          dataKey={dataset.label}
          fill={dataset.color ?? defaultColors[index % defaultColors.length]}
          radius={[4, 4, 0, 0]}
        />
      ))}
    </RechartsCore.BarChart>
  );
}

/**
 * Renders a line chart using Recharts.
 * @returns The Recharts LineChart element
 */
function LineChartRenderer({
  chartData,
  validDatasets,
  showLegend,
}: Pick<GraphChartRenderProps, "chartData" | "validDatasets" | "showLegend">) {
  return (
    <RechartsCore.LineChart data={chartData}>
      <RechartsCore.CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        stroke="var(--border)"
      />
      <RechartsCore.XAxis
        dataKey="name"
        stroke="var(--muted-foreground)"
        axisLine={false}
        tickLine={false}
      />
      <RechartsCore.YAxis
        stroke="var(--muted-foreground)"
        axisLine={false}
        tickLine={false}
      />
      <RechartsCore.Tooltip
        cursor={{
          stroke: "var(--muted)",
          strokeWidth: 2,
          strokeOpacity: 0.3,
        }}
        contentStyle={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "var(--radius)",
          color: "var(--foreground)",
        }}
      />
      {showLegend && (
        <RechartsCore.Legend
          wrapperStyle={{
            color: "var(--foreground)",
          }}
        />
      )}
      {validDatasets.map((dataset, index) => (
        <RechartsCore.Line
          key={dataset.label}
          type="monotone"
          dataKey={dataset.label}
          stroke={dataset.color ?? defaultColors[index % defaultColors.length]}
          dot={false}
        />
      ))}
    </RechartsCore.LineChart>
  );
}

/**
 * Renders a pie chart using Recharts.
 * @returns The Recharts PieChart element, or a message if no valid dataset
 */
function PieChartRenderer({
  validDatasets,
  maxDataPoints,
  showLegend,
  labels,
}: Pick<
  GraphChartRenderProps,
  "validDatasets" | "maxDataPoints" | "showLegend" | "labels"
>) {
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
        data={pieDataset.data.slice(0, maxDataPoints).map((value, index) => ({
          name: labels[index],
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
          color: "var(--foreground)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
        itemStyle={{
          color: "var(--foreground)",
        }}
        labelStyle={{
          color: "var(--foreground)",
        }}
      />
      {showLegend && (
        <RechartsCore.Legend
          wrapperStyle={{
            color: "var(--foreground)",
          }}
        />
      )}
    </RechartsCore.PieChart>
  );
}

/**
 * Renders the appropriate chart type based on the chart data.
 * @returns The Recharts chart element for the given chart type
 */
function ChartRenderer(props: GraphChartRenderProps) {
  switch (props.chartType) {
    case "bar":
      return <BarChartRenderer {...props} />;
    case "line":
      return <LineChartRenderer {...props} />;
    case "pie":
      return <PieChartRenderer {...props} />;
  }
}

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
 * @returns The styled graph component
 */
export const Graph = React.forwardRef<HTMLDivElement, GraphProps>(
  (
    { className, variant, size, data, title, showLegend = true, ...props },
    ref,
  ) => {
    return (
      <GraphBase.ErrorBoundary
        renderError={() => (
          <div className={cn(graphVariants({ variant, size }), className)}>
            <div className="p-4 flex items-center justify-center h-full">
              <div className="text-destructive text-center">
                <p className="font-medium">Error loading chart</p>
                <p className="text-sm mt-1">
                  An error occurred while rendering. Please try again.
                </p>
              </div>
            </div>
          </div>
        )}
      >
        <GraphBase.Root
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          data={data}
          title={title}
          showLegend={showLegend}
          {...props}
        >
          <GraphLoadingIndicator />
          <div className="p-4 h-full">
            <GraphBase.Title className="text-lg font-medium mb-4 text-foreground" />
            <GraphBase.Chart className="w-full h-[calc(100%-2rem)]">
              {(chartProps) => (
                <RechartsCore.ResponsiveContainer width="100%" height="100%">
                  <ChartRenderer {...chartProps} />
                </RechartsCore.ResponsiveContainer>
              )}
            </GraphBase.Chart>
          </div>
        </GraphBase.Root>
      </GraphBase.ErrorBoundary>
    );
  },
);
Graph.displayName = "Graph";
