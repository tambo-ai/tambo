# Hydra-AI Weather App Demo

In this demo app, we showcase how the `hydra-ai` package can be used to create a weather application where the AI chooses between different pre-built React components and hydrates them to display weather information dynamically within a chatbox.

After each User message hydra will try to respond with one of the registered components.

The app uses several components that can be found under `/src/app/components` to display information in a way that makes sense based on the content.

## Usage

### Steps

1. **Add your OpenAI Key**

Create a file called `.env.local` under `/src/`.

Add your OpenAI Key, like:

```bash
OPENAI_API_KEY=<your key>
```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## About

This app is a NextJS where the package is used from within server actions, and resulting components are sent to the frontend to be displayed in the chatbox.

Under `src/app/services/hydra.ts` we register the components:

```jsx
const hydra = new Hydra(openAIKey);

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

return hydra;
```

and under `src/app/services/component-gen.service.ts` we call hydra to generate components:

```jsx
"use server";

import Hydra from "hydra-ai";
import { ReactElement } from "react";
import { initHydra } from "./hydra";

let hydra: Hydra | null;

export const generateDynamicMessage = async (
  message: string
): Promise<ReactElement> => {
  if (!hydra) {
    hydra = initHydra(process.env.OPENAI_API_KEY ?? "");
  }
  const response = await hydra.generateComponent(message);
  return response;
};
```
