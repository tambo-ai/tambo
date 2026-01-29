import { cva } from "class-variance-authority";
import * as React from "react";
import * as RechartsCore from "recharts";
import { z } from "zod";
import { cn } from "../../lib/utils";

/**
 * Type for graph variant
 */
type GraphVariant = "default" | "solid" | "bordered";

/**
 * Type for graph size
 */
type GraphSize = "default" | "sm" | "lg";

/**
 * Variants for the Graph component
 */
export const graphVariants = cva(
  "w-full rounded-lg overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white",
        solid: "shadow-lg bg-gray-50",
        bordered: "border-2 border-gray-200",
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
 * Props for the error boundary
 */
interface GraphErrorBoundaryProps {
  children: React.ReactNode;
  className?: string;
  variant?: GraphVariant;
  size?: GraphSize;
}

/**
 * Error boundary for catching rendering errors in the Graph component
 */
class GraphErrorBoundary extends React.Component<
  GraphErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: GraphErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error rendering chart:", error, errorInfo);
  }

  render(): React.ReactNode {
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
          <div className="p-4 flex items-center justify-center h-full">
            <div className="text-red-600 text-center">
              <p className="font-medium">Error loading chart</p>
              <p className="text-sm mt-1">
                An error occurred while rendering. Please try again.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
 * Default colors for the Graph component
 */
const defaultColors = [
  "hsl(220, 100%, 62%)", // Blue
  "hsl(160, 82%, 47%)", // Green
  "hsl(32, 100%, 62%)", // Orange
  "hsl(340, 82%, 66%)", // Pink
];

/**
 * A component that renders various types of charts using Recharts
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
            <div className="flex flex-col items-center gap-2 text-gray-500">
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
            <div className="text-gray-500 text-center">
              <p className="text-sm">Building chart...</p>
            </div>
          </div>
        </div>
      );
    }

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
            <div className="text-gray-500 text-center">
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
            <div className="text-gray-500 text-center">
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
                stroke="#e5e7eb"
              />
              <RechartsCore.XAxis
                dataKey="name"
                stroke="#6b7280"
                axisLine={false}
                tickLine={false}
              />
              <RechartsCore.YAxis
                stroke="#6b7280"
                axisLine={false}
                tickLine={false}
              />
              <RechartsCore.Tooltip
                cursor={{
                  fill: "#6b7280",
                  fillOpacity: 0.1,
                  radius: 4,
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  color: "#111827",
                }}
              />
              {showLegend && (
                <RechartsCore.Legend
                  wrapperStyle={{
                    color: "#111827",
                  }}
                />
              )}
              {validDatasets.map((dataset, index) => (
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
                stroke="#e5e7eb"
              />
              <RechartsCore.XAxis
                dataKey="name"
                stroke="#6b7280"
                axisLine={false}
                tickLine={false}
              />
              <RechartsCore.YAxis
                stroke="#6b7280"
                axisLine={false}
                tickLine={false}
              />
              <RechartsCore.Tooltip
                cursor={{
                  stroke: "#e5e7eb",
                  strokeWidth: 2,
                  strokeOpacity: 0.3,
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  color: "#111827",
                }}
              />
              {showLegend && (
                <RechartsCore.Legend
                  wrapperStyle={{
                    color: "#111827",
                  }}
                />
              )}
              {validDatasets.map((dataset, index) => (
                <RechartsCore.Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={
                    dataset.color ?? defaultColors[index % defaultColors.length]
                  }
                  strokeWidth={2}
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
                <div className="text-gray-500 text-center">
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
                  borderRadius: "8px",
                  color: "#111827",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                itemStyle={{
                  color: "#111827",
                }}
                labelStyle={{
                  color: "#111827",
                }}
              />
              {showLegend && (
                <RechartsCore.Legend
                  wrapperStyle={{
                    color: "#111827",
                  }}
                />
              )}
            </RechartsCore.PieChart>
          );
        }
      }
    };

    return (
      <GraphErrorBoundary className={className} variant={variant} size={size}>
        <div
          ref={ref}
          className={cn(graphVariants({ variant, size }), className)}
          {...props}
        >
          <div className="p-4 h-full">
            {title && (
              <h3 className="text-lg font-medium mb-4 text-gray-900">
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
      </GraphErrorBoundary>
    );
  },
);
Graph.displayName = "Graph";
