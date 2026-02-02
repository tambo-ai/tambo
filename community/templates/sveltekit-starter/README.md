# SvelteKit Tambo Starter

A modern starter template for building AI-powered applications with [Tambo](https://tambo.co) and SvelteKit. Built on Svelte 5's runes system for fine-grained reactivity and streaming-first AI interactions.

## Features

- **Svelte 5 Runes** - Built with `$state`, `$derived`, and `$effect` for reactive state management
- **Streaming First** - Full support for streaming responses, tool calls, and component rendering
- **Generative UI** - AI can render custom components (Graphs, DataCards) directly in the chat
- **Type Safety** - End-to-end TypeScript with Zod schemas for component props and tool inputs
- **Modern Styling** - Tailwind CSS v4 with OKLCH color system and dark mode support

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your Tambo API key:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
VITE_TAMBO_API_KEY=your_api_key_here
```

Get your API key from [tambo.co](https://tambo.co).

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.

## Project Structure

```
src/
├── config/
│   └── tambo.ts              # Component and tool registration
├── components/tambo/
│   ├── Graph.svelte          # Chart component (bar, line, pie)
│   ├── DataCard.svelte       # Selectable card grid component
│   ├── Message.svelte        # Chat message display
│   ├── MessageInput.svelte   # Chat input with submit
│   ├── MessageThreadFull.svelte  # Full chat interface
│   └── ...
├── services/
│   └── population-stats.ts   # Demo data service
├── routes/
│   ├── +layout.svelte        # TamboProvider setup
│   └── +page.svelte          # Main chat page
└── app.css                   # Global styles
```

## How It Works

### TamboProvider Setup

The app wraps your routes with `TamboProvider` in `+layout.svelte`:

```svelte
<script lang="ts">
  import { TamboProvider } from "@tambo-ai/svelte";
  import { components, tools } from "../config/tambo.js";

  let { children } = $props();
</script>

<TamboProvider apiKey={import.meta.env.VITE_TAMBO_API_KEY} {components} {tools}>
  {@render children()}
</TamboProvider>
```

### Registering Components

Components are registered in `src/config/tambo.ts` with Zod schemas that describe their props:

```typescript
import Graph from "../components/tambo/Graph.svelte";
import type { TamboComponent } from "@tambo-ai/svelte";
import { z } from "zod";

const graphSchema = z.object({
  data: z.object({
    type: z.enum(["bar", "line", "pie"]),
    labels: z.array(z.string()),
    datasets: z.array(
      z.object({
        label: z.string(),
        data: z.array(z.number()),
      }),
    ),
  }),
  title: z.string(),
});

export const components: TamboComponent[] = [
  {
    name: "Graph",
    description: "Renders bar, line, or pie charts with customizable data",
    component: Graph,
    propsSchema: graphSchema,
  },
];
```

### Registering Tools

Tools allow the AI to fetch data or perform actions:

```typescript
import type { TamboTool } from "@tambo-ai/svelte";
import { z } from "zod";

const inputSchema = z.object({
  continent: z.string().optional().describe("Filter by continent"),
  limit: z.number().optional().describe("Limit results"),
});

export const tools: TamboTool[] = [
  {
    name: "countryPopulation",
    description: "Get population statistics by country",
    tool: async (input) => {
      // Fetch or compute data
      return data;
    },
    toolSchema: inputSchema,
  },
];
```

### Using Tambo Hooks

Access Tambo functionality in your components:

```svelte
<script lang="ts">
  import { useTamboThread, useTamboThreadInput } from "@tambo-ai/svelte";

  const thread = useTamboThread();
  const input = useTamboThreadInput();

  async function handleSubmit() {
    await thread.sendMessage(input.value);
    input.clear();
  }
</script>
```

## Demo: Population Statistics

This template includes a demo that showcases:

1. **Tool Execution** - Ask about population data and the AI will call the appropriate tool
2. **Dynamic Charts** - Results are visualized using the Graph component
3. **Data Cards** - Country information displayed as interactive cards

Try these prompts:

- "Show me the global population trend from 2010 to 2023"
- "What are the top 5 most populous countries?"
- "Compare population growth rates in Asia"

## Available Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start development server         |
| `npm run build`   | Build for production             |
| `npm run preview` | Preview production build         |
| `npm run check`   | Run svelte-check for type errors |
| `npm run lint`    | Run ESLint                       |
| `npm run format`  | Format code with Prettier        |

## Customization

### Adding New Components

1. Create your component in `src/components/tambo/`
2. Define a Zod schema for its props
3. Register it in `src/config/tambo.ts`

### Adding New Tools

1. Create your tool function (can be async)
2. Define a Zod schema for its input
3. Register it in `src/config/tambo.ts`

### Styling

- Global styles: `src/app.css`
- Tailwind config: `vite.config.ts` (uses Tailwind v4)
- Component styles: Use Tailwind classes or scoped `<style>` blocks

## Requirements

- Node.js 18+
- npm 9+

## Learn More

- [Tambo Documentation](https://tambo.co/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [@tambo-ai/svelte SDK](https://github.com/tambo-ai/tambo)

## License

MIT
