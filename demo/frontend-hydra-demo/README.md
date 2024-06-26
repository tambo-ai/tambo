# Hydra-AI History App Demo

In this demo app, we showcase how the `hydra-ai` package can be used to create a history learning application where the AI chooses between different pre-built React components and hydrates them to display historical information dynamically within a chatbox.

After each User message hydra will try to respond with one of the registered components.

The app uses several components such as `HistoricalEventCard`, `TimelineCard`, `HistoricalFigureCard`, and `HistoricalQuote` to display information in a way that makes sense based on the content.

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

under `src/app/services/hydra.ts` we register the components:

```jsx
export const initHydra = (openAIKey: string) => {
  const hydra = new Hydra(openAIKey);

  hydra.registerComponent("HistoricalEventCard", HistoricalEventCard, {
    title: "string",
    date: "string",
    description: "string",
  });

  hydra.registerComponent("HistoricalFigureCard", HistoricalFigureCard, {
    name: "string",
    birthDate: "string",
    deathDate: "string",
    bio: "string",
    awards: "string",
  });

  hydra.registerComponent("TimelineCard", TimelineCard, {
    period: "string",
    events: "Array<{ year: string, event: string }>",
  });

  hydra.registerComponent("HistoricalQuote", HistoricalQuote, {
    quote: "string",
    author: "string",
    year: "string",
  });

  return hydra;
};
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
