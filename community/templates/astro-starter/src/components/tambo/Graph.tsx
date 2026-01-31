"use client";

import { memo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTamboStreamStatus } from "@tambo-ai/react";
import { Loader2 } from "lucide-react";

interface Dataset {
  label: string;
  data: number[];
  color?: string;
}

interface GraphData {
  type: "bar" | "line" | "pie";
  labels: string[];
  datasets: Dataset[];
}

interface GraphProps {
  data: GraphData;
  title?: string;
  showLegend?: boolean;
  variant?: "default" | "solid" | "bordered";
  size?: "default" | "sm" | "lg";
}

const COLORS = ["#18181b", "#52525b", "#a1a1aa", "#d4d4d8", "#71717a"];

/**
 * A versatile chart component that renders Bar, Line, or Pie charts using Recharts.
 * Automatically handles data transformation and responsive resizing.
 * Integrates with Tambo's stream status to show a loader during generation.
 */
export const Graph = memo(function Graph({
  data,
  title,
  showLegend = true,
  variant = "default",
  size = "default",
}: GraphProps) {
  const { streamStatus } = useTamboStreamStatus();

  // Transform data for Recharts
  const chartData = data.labels.map((label, index) => {
    const point: Record<string, string | number> = { name: label };
    data.datasets.forEach((dataset) => {
      point[dataset.label] = dataset.data[index];
    });
    return point;
  });

  const heightClasses = {
    sm: "h-64",
    default: "h-80",
    lg: "h-96",
  };

  const variantClasses = {
    default: "bg-white",
    solid: "bg-zinc-50 border border-zinc-100",
    bordered: "bg-white border border-zinc-200",
  };

  // Check if we have enough data to render
  const hasData =
    data &&
    data.labels &&
    data.labels.length > 0 &&
    data.datasets &&
    data.datasets.length > 0;

  if (!hasData) {
    return (
      <div
        className={`flex items-center justify-center ${heightClasses[size]} ${variantClasses[variant]} rounded-xl`}
      >
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const renderChart = () => {
    switch (data.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                }}
              />
              {showLegend && <Legend />}
              {data.datasets.map((dataset, index) => (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={dataset.color || COLORS[index % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                }}
              />
              {showLegend && <Legend />}
              {data.datasets.map((dataset, index) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.color || COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: "white", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        const pieData = data.labels.map((label, index) => ({
          name: label,
          value: data.datasets[0]?.data[index] || 0,
        }));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                }}
              />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`p-6 rounded-xl ${variantClasses[variant]} ${heightClasses[size]}`}
    >
      {title && (
        <h3 className="text-sm font-semibold mb-6 text-zinc-900 uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="w-full h-[calc(100%-2rem)]">{renderChart()}</div>
    </div>
  );
});
