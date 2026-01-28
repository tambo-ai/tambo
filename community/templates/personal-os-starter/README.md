# Personal OS Starter (Bento Grid)

A highly aesthetic "Personal OS" dashboard template featuring a Bento Grid layout, beautiful widgets, and AI customization via Tambo.

## 💡 The Idea: "Personal OS" (The Self-Building Dashboard)

**The Concept:**
A modular, "Bento-style" dashboard that uses AI to **design itself** based on the user's context. Instead of manually dragging widgets around, the user simply tells the AI what "mode" they are in, and the OS adapts.

**Why Use This Template?**
Most dashboards are static. You build them once and they stay that way. **Personal OS** is _alive_.

- **Context Awareness:** using `useTambo` hook to render entire layouts.
- **Coding Mode:** _"I'm coding."_ -> Shows **GitHub Widget** (PRs), **Focus Timer**, and **Lo-Fi Music**.
- **Relaxing Mode:** _"I'm relaxing."_ -> Shows **News Widget**, **Weather**, and **Twitter Feed**.

## Features

- **Bento Grid Layout:** Responsive masonry-style grid with smooth animations.
- **Context-Aware Engine:** AI switches "Modes" by generating entirely new grid layouts.
- **7+ Interactive Widgets:**
  - `GitHubWidget`: View PRs and Commits.
  - `TimerWidget`: Focus/Pomodoro timer.
  - `NewsWidget`: Headlines and sources.
  - `WeatherWidget`: Visual weather cards.
  - `TasksWidget`: Checklist with state.
  - `MusicWidget`: Spotify-style player.
  - `StatsWidget`: Trend metrics.
- **Tech Stack:** Next.js 15, Tailwind v4, Framer Motion.

## Why this is valuable

This template solves the "Blank Canvas" problem for personal dashboards. It provides a premium, Apple-style UI out of the box and demonstrates a generic "Widget System" that any developer can extend. It is the perfect starting point for building "Notion-like" or "Linear-like" tools with Tambo.

## 🎥 Video Demo

[Download/Watch Demo Video](public/video.mp4)

_(Note: For the best experience, we recommend watching the high-quality recording uploaded to the PR)_

## 📸 Screenshots

![Default Dashboard](public/screenshot-default.png)
_The default Bento Grid view_

![Context Aware Mode](public/screenshot-context.png)
_Context-Aware Mode: "Coding" profile activated by AI_

## 🚀 Quick Start

1.  **Clone & Run:**

    ```bash
    git clone https://github.com/your-username/personal-os-starter.git
    cd personal-os-starter
    npm install
    npm run dev
    ```

2.  **Open Dashboard:** Go to `http://localhost:3000`. You'll see the default Bento Grid with Weather, Tasks, and Music widgets.

3.  **Ask the AI:** Click "Ask AI to Customize" and try these prompts:
    - _"Add a weather widget for New York."_
    - _"Create a checklist for my morning routine."_
    - _"Show me a music widget for Daft Punk."_
    - _"Add a stat card for 'Followers' with value '10k' and trending up."_

## Get Started

1. Run `npm install`
2. `npx tambo init` (or add your API key to `.env.local`)
3. `npm run dev`

## Customizing

### Change what components tambo can control

You can see how components are registered with tambo in `src/lib/tambo.ts`:

```tsx
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  // Add more components here
];
```

You can install the graph component into any project with:

```bash
npx tambo add graph
```

The example Graph component demonstrates several key features:

- Different prop types (strings, arrays, enums, nested objects)
- Multiple chart types (bar, line, pie)
- Customizable styling (variants, sizes)
- Optional configurations (title, legend, colors)
- Data visualization capabilities

Update the `components` array with any component(s) you want tambo to be able to use in a response!

You can find more information about the options [here](https://docs.tambo.co/concepts/generative-interfaces/generative-components)

### Add tools for tambo to use

Tools are defined with `inputSchema` and `outputSchema`:

```tsx
export const tools: TamboTool[] = [
  {
    name: "globalPopulation",
    description:
      "A tool to get global population trends with optional year range filtering",
    tool: getGlobalPopulationTrend,
    inputSchema: z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        year: z.number(),
        population: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
];
```

Find more information about tools [here.](https://docs.tambo.co/concepts/tools)

### The Magic of Tambo Requires the TamboProvider

Make sure in the TamboProvider wrapped around your app:

```tsx
...
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  components={components} // Array of components to control
  tools={tools} // Array of tools it can use
>
  {children}
</TamboProvider>
```

In this example we do this in the `Layout.tsx` file, but you can do it anywhere in your app that is a client component.

### Voice input

The template includes a `DictationButton` component using the `useTamboVoice` hook for speech-to-text input.

### MCP (Model Context Protocol)

The template includes MCP support for connecting to external tools and resources. You can use the MCP hooks from `@tambo-ai/react/mcp`:

- `useTamboMcpPromptList` - List available prompts from MCP servers
- `useTamboMcpPrompt` - Get a specific prompt
- `useTamboMcpResourceList` - List available resources

See `src/components/tambo/mcp-components.tsx` for example usage.

### Change where component responses are shown

The components used by tambo are shown alongside the message response from tambo within the chat thread, but you can have the result components show wherever you like by accessing the latest thread message's `renderedComponent` field:

```tsx
const { thread } = useTambo();
const latestComponent =
  thread?.messages[thread.messages.length - 1]?.renderedComponent;

return (
  <div>
    {latestComponent && (
      <div className="my-custom-wrapper">{latestComponent}</div>
    )}
  </div>
);
```

For more detailed documentation, visit [Tambo's official docs](https://docs.tambo.co).
