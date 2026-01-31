"use client";

import { z } from "zod";
import type { TamboComponent } from "@tambo-ai/react";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

// MetricCard Component - Displays a single metric with optional trend
interface MetricCardProps {
    title: string;
    value: string;
    description?: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
}

function MetricCard({
    title,
    value,
    description,
    trend = "neutral",
    trendValue,
}: MetricCardProps) {
    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    const trendColor =
        trend === "up"
            ? "text-success"
            : trend === "down"
                ? "text-danger"
                : "text-muted-foreground";

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold text-card-foreground">{value}</p>
                </div>
                {trendValue && (
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{trendValue}</span>
                    </div>
                )}
            </div>
            {description && (
                <p className="mt-3 text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    );
}

// BarChart Component - Displays data as a simple bar chart
interface BarChartDataPoint {
    label: string;
    value: number;
}

interface BarChartProps {
    title: string;
    data: BarChartDataPoint[];
    color?: "primary" | "success" | "warning" | "danger";
}

function BarChart({ title, data, color = "primary" }: BarChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value));
    const colorClasses = {
        primary: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        danger: "bg-danger",
    };

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
            </div>
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium text-card-foreground">{item.value}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary">
                            <div
                                className={`h-2 rounded-full ${colorClasses[color]} transition-all duration-500`}
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// DataTable Component - Displays tabular data
interface DataTableProps {
    title: string;
    headers: string[];
    rows: string[][];
}

function DataTable({ title, headers, rows }: DataTableProps) {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/50 px-6 py-4">
                <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-3 text-left text-sm font-medium text-muted-foreground"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-b border-border last:border-0 hover:bg-muted/20"
                            >
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className="px-6 py-4 text-sm text-card-foreground"
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Define Zod schemas for each component
const metricCardSchema = z.object({
    title: z.string().describe("The title of the metric"),
    value: z.string().describe("The main value to display"),
    description: z.string().optional().describe("Additional description text"),
    trend: z
        .enum(["up", "down", "neutral"])
        .optional()
        .describe("The trend direction"),
    trendValue: z.string().optional().describe("The trend percentage or value"),
});

const barChartSchema = z.object({
    title: z.string().describe("The title of the chart"),
    data: z
        .array(
            z.object({
                label: z.string().describe("Label for this data point"),
                value: z.number().describe("Numeric value for this data point"),
            })
        )
        .describe("Array of data points to display"),
    color: z
        .enum(["primary", "success", "warning", "danger"])
        .optional()
        .describe("Color theme for the bars"),
});

const dataTableSchema = z.object({
    title: z.string().describe("The title of the table"),
    headers: z.array(z.string()).describe("Column headers"),
    rows: z.array(z.array(z.string())).describe("Table rows as arrays of strings"),
});

// Export Tambo component definitions
export const tamboComponents: TamboComponent[] = [
    {
        name: "MetricCard",
        description:
            "Displays a single metric with a title, value, optional description, and trend indicator. Use for KPIs like revenue, users, conversions.",
        component: MetricCard,
        propsSchema: metricCardSchema,
    },
    {
        name: "BarChart",
        description:
            "Displays data as a horizontal bar chart. Use for comparing values across categories like sales by region or users by plan.",
        component: BarChart,
        propsSchema: barChartSchema,
    },
    {
        name: "DataTable",
        description:
            "Displays tabular data with headers and rows. Use for lists of items like recent orders, user activity, or transaction history.",
        component: DataTable,
        propsSchema: dataTableSchema,
    },
];

// Export individual components for direct use
export { MetricCard, BarChart, DataTable };
