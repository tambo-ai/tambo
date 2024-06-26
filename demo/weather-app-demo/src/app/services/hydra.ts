import Hydra from "hydra-ai";
import CurrentWeather from "../components/current-weather";
import RainChart from "../components/rain-chart";
import WeatherTimeChart from "../components/weather-timechart";
import WindTimeChart from "../components/wind-timechart";

export const initHydra = (openAIKey: string) => {
  const hydra = new Hydra(openAIKey);

  hydra.registerComponent("CurrentWeather", CurrentWeather, {
    temperatureFahrenheit: "number",
    description: "string",
    weather: '"rain" | "sun" | "cloud" | "snow" | "clear"',
  });

  hydra.registerComponent("RainChart", RainChart, {
    data: "Array<{ hour: string; rainAmountInches: number }>",
  });

  hydra.registerComponent("WeatherTimeChart", WeatherTimeChart, {
    data: 'Array<{ hourOrDay: string; temperature: number; condition: "rain" | "sun" | "cloud" | "snow" | "partly-cloudy"}>',
  });

  hydra.registerComponent("WindTimeChart", WindTimeChart, {
    data: "Array<{ hourOrDay: string; windSpeedMph: number; windDirection: string }>",
  });

  return hydra;
};
