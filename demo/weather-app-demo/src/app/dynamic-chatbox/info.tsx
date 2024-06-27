import CurrentWeather from "../components/current-weather";
import RainChart from "../components/rain-chart";
import WeatherTimeChart from "../components/weather-timechart";
import WindTimeChart from "../components/wind-timechart";
import { sampleRainData, sampleWeatherData, sampleWindData } from "../helpers";

export const Info = () => {
  return (
    <div className="w-full flex flex-col justify-center">
      <h1 className="text-2xl font-bold">HydraAI</h1>
      <p className="p-4">
        This is a demo that shows how Hydra lets you register components and
        lets AI choose from them and hydrate their props when needed.
      </p>
      <p className="p-4">
        In this demo, we registered a few weather related components, and after
        each user message we ask hydra to generate one of the components based
        on the conversation. The idea is to let Hydra decide when a user wants
        to see a certain feature and provide it, rather than hardcoding the
        layout of components and the flow of UX as with a usual app.
      </p>

      <p className="p-4">
        Here are all the components that Hydra knows about in this demo, shown
        here with random props. Try asking about rain forecasts for example to
        guide Hydra towards the RainChart component.
      </p>
      <p className="p-4">CurrentWeather component: </p>
      <CurrentWeather
        temperatureFahrenheit={"71"}
        description={"A clear day!"}
        weather={"sun"}
      />
      <p className="p-4">WeatherTimeChart component: </p>
      <WeatherTimeChart data={sampleWeatherData} />

      <p className="p-4">RainChart component: </p>
      <RainChart data={sampleRainData} />

      <p className="p-4">WindTimeChart component: </p>
      <WindTimeChart data={sampleWindData} />
      <p className="p-4">
        Note: The demo will try to respond with one of the components every
        message, even if it would not normally make sense to show one.
      </p>
    </div>
  );
};
