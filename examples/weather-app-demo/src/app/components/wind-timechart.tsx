import React from "react";

export interface WindData {
  hourOrDay: string; // could be an hour (e.g., "1 AM") or a day (e.g., "Monday")
  windSpeedMph: number;
  windDirection: string;
}

interface WindTimeChartProps {
  data: WindData[];
}

const WindTimeChart: React.FC<WindTimeChartProps> = ({ data }) => {
  const getWindIcon = (speed: number) => {
    if (speed > 20) {
      return "💨"; // Strong wind
    } else if (speed > 10) {
      return "🌬️"; // Moderate wind
    } else {
      return "🍃"; // Light wind
    }
  };

  return (
    <div className="p-6 rounded-lg my-4 bg-white text-black">
      <p className="mb-4 font-bold">Wind Forecast</p>
      <div className="flex justify-between items-center h-48 overflow-x-auto">
        {data.map((point, index) => (
          <div
            key={index}
            className="flex flex-col items-center mx-4 text-center"
            style={{ minWidth: "80px" }} // Set a minimum width to prevent wrapping
          >
            <div className="text-2xl">{getWindIcon(point.windSpeedMph)}</div>
            <div className="text-sm">{point.windSpeedMph} mph</div>
            <div className="text-sm text-gray-600">{point.windDirection}</div>
            <span className="mt-2 text-xs text-gray-600">
              {point.hourOrDay}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WindTimeChart;
