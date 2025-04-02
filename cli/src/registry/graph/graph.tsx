"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import * as RechartsCore from "recharts";

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

/**
 * Represents a graph data object
 * @property {string} type - Type of graph to render
 * @property {string[]} labels - Labels for the graph
 * @property {Object[]} datasets - Data for the graph
 */
export interface GraphData {
  type: "bar" | "line" | "pie";
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

/**
 * Props for the Graph component
 * @interface
 * @extends React.HTMLAttributes<HTMLDivElement>
 * @extends VariantProps<typeof graphVariants>
 */
export interface GraphProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof graphVariants> {
  /** Data object containing chart configuration and values */
  data: GraphData;
  /** Optional title for the chart */
  title?: string;
  /** Whether to show the legend (default: true) */
  showLegend?: boolean;
}

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
    if (
      !data?.labels ||
      !data?.datasets ||
      !Array.isArray(data.labels) ||
      !Array.isArray(data.datasets) ||
      data.datasets.some(
        (dataset) =>
          !Array.isArray(dataset.data) ||
          dataset.data.length !== data.labels.length,
      )
    ) {
      console.error("Invalid graph data structure:", data);
      return (
        <div
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-4 text-destructive">
            Error: Invalid data structure. Ensure all datasets have the same
            length as labels.
          </div>
        </div>
      );
    }

    // Transform data for Recharts
    const chartData = data.labels.map((label, index) => ({
      name: label,
      ...Object.fromEntries(
        data.datasets.map((dataset) => [dataset.label, dataset.data[index]]),
      ),
    }));

    const renderChart = () => {
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
                  fill: "hsl(var(--muted)/0.3)",
                  radius: 4,
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
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
              {data.datasets.map((dataset, index) => (
                <RechartsCore.Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={
                    dataset.color ?? defaultColors[index % defaultColors.length]
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
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
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
              {data.datasets.map((dataset, index) => (
                <RechartsCore.Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={
                    dataset.color ?? defaultColors[index % defaultColors.length]
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
  },
);
Graph.displayName = "Graph";
