import { HydraClient } from "hydra-ai";
import CurrentWeather from "./components/current-weather";
import RainChart from "./components/rain-chart";
import { TodoItemCard } from "./components/todo-item";
import WeatherTimeChart from "./components/weather-timechart";
import WindTimeChart from "./components/wind-timechart";

const hydra = new HydraClient();

hydra.registerComponent("TodoItem", TodoItemCard, {
  item: "{id: string; title: string; isDone: boolean}",
});

hydra.registerComponent("CurrentWeather", CurrentWeather, {
  temperatureFahrenheit: "number",
  description: "string",
  weather: '"rain" | "sun" | "cloud" | "snow" | "clear"',
});

hydra.registerComponent("RainChart", RainChart, {
  data: "Array<{ hourOrDay: string; rainChancePercent: number }>",
});

hydra.registerComponent("WeatherTimeChart", WeatherTimeChart, {
  data: 'Array<{ hourOrDay: string; temperature: number; condition: "rain" | "sun" | "cloud" | "snow" | "partly-cloudy"}>',
});

hydra.registerComponent("WindTimeChart", WindTimeChart, {
  data: "Array<{ hourOrDay: string; windSpeedMph: number; windDirection: string }>",
});

export default hydra;
