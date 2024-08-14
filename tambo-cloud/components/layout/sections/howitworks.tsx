import React from "react";
import Code from "@/components/code";
import Example from "@/components/example";

const codeExamples = {
  registerComponents: `import { HydraClient } from "hydra-ai";
import WeatherForecast from "./components/weather-forecast";
import DailyForecast from "./components/daily-forecast";

const hydra = new HydraClient();

hydra.registerComponent("WeatherForecast", WeatherForecast, {
  city: "string",
  country: "string",
  unit: '"celsius" | "fahrenheit"',
});

hydra.registerComponent("DailyForecast", DailyForecast, {
  day: "string",
  temperature: "number",
  condition: '"sunny" | "cloudy" | "rainy" | "snowy"',
});

export default hydra;`,

  useHydraComponent: `"use client";

import { ReactElement, useEffect, useState } from "react";
import hydra from "./hydra-client";

export default function Home() {
  const [weatherComponent, setWeatherComponent] = useState<ReactElement | null>(null);

  const generateWeatherForecast = async () => {
    const component = await hydra.generateComponent("Show a 5-day weather forecast for New York");
    setWeatherComponent(component);
  };

  useEffect(() => {
    generateWeatherForecast();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {weatherComponent}
    </main>
  );
}`,
};

export const HowItWorksSection = () => {
  return (
    <section className="bg-background pb-24">
      <div className="container mx-auto">
        <div className="space-y-16">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">
                1. Register Your Components
              </h3>
              <p className="text-lg text-muted-foreground">
                Define and register your custom components with Hydra AI to
                enable AI-driven rendering.
              </p>
            </div>
            <Code
              language="javascript"
              fileName="app/hydra-client.ts"
              code={codeExamples.registerComponents}
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 md:order-2">
              <h3 className="text-2xl font-semibold">
                2. Use Hydra to Generate Components
              </h3>
              <p className="text-lg text-muted-foreground">
                Utilize Hydra AI to dynamically generate and render components
                based on user input or context.
              </p>
            </div>
            <Code
              language="jsx"
              fileName="app/page.tsx"
              code={codeExamples.useHydraComponent}
            />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">
                3. Interact with Generated UI
              </h3>
              <p className="text-lg text-muted-foreground">
                Engage with your Hydra AI components through interactive
                elements, allowing users to dynamically modify and control the
                generated UI.
              </p>
            </div>
            <Example />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
