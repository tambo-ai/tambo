import React from "react";

interface CurrentWeatherProps {
  temperatureFahrenheit: string;
  description: string;
  weather: "rain" | "sun" | "cloud" | "snow" | "clear";
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({
  temperatureFahrenheit,
  description,
  weather,
}) => {
  const getWeatherIcon = (weather: string) => {
    if (weather === "rain") {
      return "🌧️";
    } else if (weather === "sun") {
      return "☀️";
    } else if (weather === "cloud") {
      return "☁️";
    } else if (weather === "snow") {
      return "❄️";
    } else {
      return "🌤️";
    }
  };

  return (
    <div className="border border-blue-500 p-4 rounded-lg my-4 bg-white text-blue-500 flex items-center">
      <div className="text-6xl mr-4">{getWeatherIcon(weather)}</div>
      <div>
        <h2 className="text-2xl font-bold">{temperatureFahrenheit} F</h2>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default CurrentWeather;
