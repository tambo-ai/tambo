import React from "react";

export interface WeatherData {
  hourOrDay: string; // could be an hour (e.g., "1 AM") or a day (e.g., "Monday")
  temperature: number;
  condition: "rain" | "sun" | "cloud" | "snow" | "partly-cloudy";
}

interface WeatherTimeChartProps {
  data: WeatherData[];
}

const WeatherTimeChart: React.FC<WeatherTimeChartProps> = ({ data }) => {
  const getWeatherIcon = (condition: string) => {
    if (condition.toLowerCase().includes("rain")) {
      return "🌧️";
    } else if (condition.toLowerCase().includes("sun")) {
      return "☀️";
    } else if (condition.toLowerCase().includes("cloud")) {
      return "☁️";
    } else if (condition.toLowerCase().includes("snow")) {
      return "❄️";
    } else {
      return "🌤️";
    }
  };

  return (
    <div className="p-6 rounded-lg my-4 bg-white text-black">
      <p>Forecast</p>
      <div className="flex justify-between items-center h-48 overflow-x-auto">
        {data.map((point, index) => (
          <div key={index} className="flex flex-col items-center mx-2">
            <div className="text-4xl">{getWeatherIcon(point.condition)}</div>
            <div className="text-lg font-bold">{point.temperature}°</div>
            <span className="mt-2 text-sm text-gray-600 text-center">
              {point.hourOrDay}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherTimeChart;
