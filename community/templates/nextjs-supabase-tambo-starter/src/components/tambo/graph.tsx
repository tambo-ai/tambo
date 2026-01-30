"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import * as React from "react";
import * as RechartsCore from "recharts";
import { z } from "zod/v3";

/* ───────────────── Types ───────────────── */

type GraphVariant = "default" | "solid" | "bordered";
type GraphSize = "default" | "sm" | "lg";

/* ───────────────── Variants ───────────────── */

export const graphVariants = cva(
  "w-full overflow-hidden border bg-card",
  {
    variants: {
      variant: {
        default: "border-border",
        solid: "border-border bg-[#0f1115]",
        bordered: "border-2 border-border",
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

/* ───────────────── Error Boundary ───────────────── */

class GraphErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    className?: string;
    variant?: GraphVariant;
    size?: GraphSize;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Graph render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
  return (
    <div
      className={cn(
        graphVariants({
          variant: this.props.variant,
          size: this.props.size,
        }),
        this.props.className,
      )}
    >
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-destructive">
            Data Unavailable
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Analytics pipeline error
          </p>
        </div>
      </div>
    </div>
  );
}

    return this.props.children;
  }
}

/* ───────────────── Schemas ───────────────── */

export const graphDataSchema = z.object({
  type: z.enum(["bar", "line", "pie"]),
  labels: z.array(z.string()),
  datasets: z.array(
    z.object({
      label: z.string(),
      data: z.array(z.number()),
      color: z.string().optional(),
    }),
  ),
});

export const graphSchema = z.object({
  data: graphDataSchema,
  title: z.string(),
  showLegend: z.boolean().optional(),
  variant: z.enum(["default", "solid", "bordered"]).optional(),
  size: z.enum(["default", "sm", "lg"]).optional(),
  className: z.string().optional(),
});

export type GraphProps = z.infer<typeof graphSchema>;
export type GraphDataType = z.infer<typeof graphDataSchema>;

/* ───────────────── Neon Palette ───────────────── */
const defaultColors = [
  "#ff7a18", // Authority / primary metric
  "#22c55e", // Positive / success
  "#eab308", // Warning / attention
  "#ef4444", // Critical / failure
  "#3b82f6", // Informational
];

/* ───────────────── Graph Component ───────────────── */

export const Graph = React.forwardRef<HTMLDivElement, GraphProps>(
  (
    { className, variant, size, data, title, showLegend = true, ...props },
    ref,
  ) => {
    /* ───────── Empty / Loading ───────── */
    if (!data) {
      return (
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="flex h-full items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-muted-foreground">
              Waiting for data
            </span>
          </div>
        </div>
      );
    }

    const validDatasets = data.datasets.filter(
      (d) => d.label && d.data?.length,
    );

    if (!validDatasets.length) {
      return (
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="flex h-full items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-muted-foreground">
              No datasets available
            </span>
          </div>
        </div>
      );
    }

    /* ───────── Data normalization ───────── */
    const maxPoints = Math.min(
      data.labels.length,
      Math.min(...validDatasets.map((d) => d.data.length)),
    );

    const chartData = data.labels.slice(0, maxPoints).map((label, i) => ({
      name: label,
      ...Object.fromEntries(
        validDatasets.map((d) => [d.label, d.data[i] ?? 0]),
      ),
    }));

    /* ───────── Tooltip (Ops style) ───────── */
    const tooltipStyle = {
      backgroundColor: "#0c0e12",
      border: "1px solid #24262b",
      borderRadius: "4px",
      color: "#e5e7eb",
      fontSize: "12px",
    };

    /* ───────── Chart Renderer ───────── */
    const renderChart = () => {
      switch (data.type) {
        case "bar":
          return (
            <RechartsCore.BarChart data={chartData}>
              <RechartsCore.CartesianGrid
                stroke="#24262b"
                vertical={false}
              />
              <RechartsCore.XAxis
                dataKey="name"
                stroke="#8b8f97"
                axisLine={false}
                tickLine={false}
              />
              <RechartsCore.YAxis
                stroke="#8b8f97"
                axisLine={false}
                tickLine={false}
              />
              <RechartsCore.Tooltip contentStyle={tooltipStyle} />
              {showLegend && (
                <RechartsCore.Legend
                  wrapperStyle={{ color: "#8b8f97", fontSize: "12px" }}
                />
              )}
              {validDatasets.map((d, i) => (
                <RechartsCore.Bar
                  key={d.label}
                  dataKey={d.label}
                  fill={d.color ?? defaultColors[i % defaultColors.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </RechartsCore.BarChart>
          );

        case "line":
          return (
            <RechartsCore.LineChart data={chartData}>
              <RechartsCore.CartesianGrid
                stroke="#24262b"
                vertical={false}
              />
              <RechartsCore.XAxis
                dataKey="name"
                stroke="#8b8f97"
                axisLine={false}
                tickLine={false}
              />
              <RechartsCore.YAxis
                stroke="#8b8f97"
                axisLine={false}
                tickLine={false}
              />
              <RechartsCore.Tooltip contentStyle={tooltipStyle} />
              {showLegend && (
                <RechartsCore.Legend
                  wrapperStyle={{ color: "#8b8f97", fontSize: "12px" }}
                />
              )}
              {validDatasets.map((d, i) => (
                <RechartsCore.Line
                  key={d.label}
                  type="monotone"
                  dataKey={d.label}
                  stroke={d.color ?? defaultColors[i % defaultColors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </RechartsCore.LineChart>
          );

        case "pie":
          return (
            <RechartsCore.PieChart>
              <RechartsCore.Pie
                data={validDatasets[0].data
                  .slice(0, maxPoints)
                  .map((v, i) => ({
                    name: data.labels[i],
                    value: v,
                    fill: defaultColors[i % defaultColors.length],
                  }))}
                dataKey="value"
                outerRadius={90}
                labelLine={false}
              />
              <RechartsCore.Tooltip contentStyle={tooltipStyle} />
              {showLegend && (
                <RechartsCore.Legend
                  wrapperStyle={{ color: "#8b8f97", fontSize: "12px" }}
                />
              )}
            </RechartsCore.PieChart>
          );
      }
    };

    /* ───────── Render ───────── */
    return (
      <GraphErrorBoundary
        variant={variant}
        size={size}
        className={className}
      >
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-4 h-full">
            {title && (
              <h3 className="mb-3 text-xs tracking-widest uppercase text-foreground">
                {title}
              </h3>
            )}

            <div className="h-[calc(100%-2rem)]">
              <RechartsCore.ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </RechartsCore.ResponsiveContainer>
            </div>
          </div>
        </div>
      </GraphErrorBoundary>
    );
  },
);

Graph.displayName = "Graph";
