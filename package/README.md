# Hydra AI

A framework for creating context-aware UI in React apps. Register your components, and let Hydra decide when to show them and how to hydrate them with the right props and context.

## Getting Started

1. **Install the package**

   ```shell
   npm i hydra-ai
   ```

2. **Set your OpenAI API key environment variable**

   In a file called `.env.local` add:

   ```
   OPENAI_API_KEY=<your openai api key>
   ```

   This will be used by the HydraBackend class server-side to make requests to OpenAI.

3. **Initialize HydraClient and Register Components**

   Somewhere in your app, create a new instance of `HydraClient`.

   Use the `registerComponent` method to create a list of components that Hydra can choose from. The method signature is:

   ```typescript
   hydra.registerComponent(
     name,
     description,
     component,
     propsDefinition,
     contextTools
   );
   ```

   - `name`: A unique name for the component.
   - `description`: A description of the component for Hydra to understand when to use it.
   - `component`: The actual React component.
   - `propsDefinition`: An object defining each available prop and its type.
   - `contextTools`: (optional) An array of functions that Hydra can call to gather extra data (e.g., fetching items from an API) when hydrating the component. Find information on how to define contextTools [here.](/package/docs/context-tools.md)

   Here’s an example:

   ```typescript
   // hydra-client.ts

   import { HydraClient } from "hydra-ai";
   import CurrentWeather from "./components/current-weather";
   import RainChart from "./components/rain-chart";

   const hydra = new HydraClient();

   hydra.registerComponent(
     "CurrentWeather",
     "Displays the current weather conditions",
     CurrentWeather,
     {
       temperatureFahrenheit: "number",
       description: "string",
       weather: '"rain" | "sun" | "cloud" | "snow" | "clear"',
     }
   );

   hydra.registerComponent(
     "RainChart",
     "Shows rain probability over time",
     RainChart,
     {
       data: "{ hourOrDay: string; rainChancePercent: number }[]",
     }
   );

   export default hydra;
   ```

4. **Have Hydra Pick and Hydrate Components Based on Context**

   To have Hydra use one of the registered components, you can call `generateComponent`:

   ```typescript
   const component = await hydra.generateComponent(message);
   ```

   Here’s an example that fetches a component dynamically and renders it:

   ```typescript
   "use client";

   import { ReactElement, useEffect, useState } from "react";
   import hydra from "./hydra-client";

   export default function Home() {
     const [dynamicComponent, setDynamicComponent] =
       useState<ReactElement | null>(null);

     const fetchComponent = async (message: string) => {
       const component = await hydra.generateComponent(message);
       setDynamicComponent(component);
     };

     useEffect(() => {
       fetchComponent("show me today's weather");
     }, []);

     return (
       <main className="flex min-h-screen flex-col items-center justify-center">
         {dynamicComponent}
       </main>
     );
   }
   ```

   If you've registered a weather-related component, Hydra will choose it based on the message and display it in the app. If you included a `contextTool` with that weather component, Hydra will handle requesting the correct data before filling in the component.

## Report a bug or Request a feature

Make a GitHub issue [here.](https://github.com/michaelmagan/hydraai/issues/new)
