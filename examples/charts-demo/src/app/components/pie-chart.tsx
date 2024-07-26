"use client";
import { Pie, PieChart, Tooltip } from "recharts";

export interface HydraPieChartProps {
  data: { name: string; value: number }[];
}

export default function HydraPieChart({ data }: HydraPieChartProps) {
  const baseColor = "#2563eb";
  const numEntries = data.length;
  const increment = 50 / (numEntries - 1);

  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return `#${(
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
      .toUpperCase()}`;
  };

  const addFillToData = (data: { name: string; value: number }[]) => {
    return data.map((item, index) => {
      const percent = increment * index;
      return {
        ...item,
        fill: lightenColor(baseColor, percent),
      };
    });
  };

  return (
    <PieChart
      width={350}
      height={250}
      className="bg-white rounded-lg shadow-lg"
    >
      <Pie
        data={addFillToData(data)}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill={baseColor}
        label
      />
      <Tooltip />
      {/* <Legend /> */}
    </PieChart>
  );
}
