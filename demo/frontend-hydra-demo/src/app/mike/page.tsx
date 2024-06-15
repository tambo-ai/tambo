"use client";

import { TimeSeriesData } from "../../../components/graph";

const exampleData = {
  title: "Example Time Series Data",
  titleClassName: "text-2xl font-bold",
  description: "This is an example of time series data.",
  descriptionClassName: "text-sm text-gray-500",
  data: [
    { timestamp: "2023-01-01", value: 100 },
    { timestamp: "2023-01-02", value: 110 },
    { timestamp: "2023-01-03", value: 120 },
  ],
  dataClassName: "list-disc list-inside bg-red-500",
};

export default function Page() {
  return (
    <div className="p-4">
      <TimeSeriesData {...exampleData} />
    </div>
  );
}
