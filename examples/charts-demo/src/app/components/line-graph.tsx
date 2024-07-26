"use client";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface HydraLineGraphProps {
  xValues: string[];
  series: { name: string; yValues: number[] }[];
}

const HydraLineGraph: React.FC<HydraLineGraphProps> = ({ xValues, series }) => {
  const baseColor = "#2563eb";
  const numEntries = series.length;
  const increment = 50 / Math.max(numEntries - 1, 1);

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

  const convertSeriesToLineChartData = (
    xValues: string[],
    series: { name: string; yValues: number[] }[]
  ) => {
    return xValues.map((xValue, index) => {
      const entry: any = { xValue };
      series.forEach((s) => {
        entry[s.name] = s.yValues[index];
      });
      return entry;
    });
  };

  const data = convertSeriesToLineChartData(xValues, series);

  return (
    <LineChart
      width={350}
      height={250}
      data={data}
      className="bg-white rounded-lg shadow-lg p-4"
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="xValue" />
      <YAxis />
      <Tooltip />
      <Legend />
      {series.map((line, index) => (
        <Line
          key={line.name}
          dataKey={line.name}
          type="monotone"
          strokeWidth={2}
          dot={false}
          name={line.name}
          stroke={lightenColor(baseColor, increment * index)}
        />
      ))}
    </LineChart>
  );
};

export default HydraLineGraph;
