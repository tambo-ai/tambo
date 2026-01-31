# Tambo Astro Template

This is a starter Astro app with Tambo hooked up to get your AI app development
started quickly.

## Get Started

1. Clone this repository or create a new project.

2. `npm install`

3. `npx tambo init`
   - or rename `.env.example` to `.env.local` and add your tambo API key you can
     get for free [here](https://tambo.co/dashboard).

4. Run `npm run dev` and go to `localhost:4321` to use the app!

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

Update the `components` array with any component(s) you want tambo to be able to
use in a response!

You can find more information about the options
[here](https://docs.tambo.co/concepts/generative-interfaces/generative-components)

### Add tools for tambo to use

Tools are defined with `inputSchema` and `outputSchema`. Check
`src/lib/tambo.ts` for examples:

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

In Astro, since we use the Islands architecture, we wrap our interactive React
components with the `TamboProvider`.

Use the `client:only="react"` directive when forcing client-side rendering for
Tambo components in your Astro pages (e.g., `src/pages/chat.astro`).

Example usage in `src/components/TamboChat.tsx`:

```tsx
<TamboProvider
  apiKey={import.meta.env.PUBLIC_TAMBO_API_KEY}
  components={components} // Array of components to control
  tools={tools} // Array of tools it can use
>
  <MessageThreadFull />
</TamboProvider>
```

### Voice input

The template includes a `DictationButton` component using the `useTamboVoice`
hook for speech-to-text input.

### MCP (Model Context Protocol)

The template includes MCP support for connecting to external tools and
resources. You can use the MCP hooks from `@tambo-ai/react/mcp`.

See `src/components/TamboChat.tsx` and `src/components/tambo/mcp-components.tsx`
for example usage.

### Change where component responses are shown

The components used by tambo are shown alongside the message response from tambo
within the chat thread, but you can have the result components show wherever you
like by accessing the latest thread message's `renderedComponent` field:

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

### Demo Image

| ai-chat page                                                                                                                        | interactivity page                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| <img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/89ab6e71-9dbb-4495-910f-9b594fbfab7b" /> | <img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/cafe2c65-ae35-4851-a1b4-4baeed4ea94c" /> |

For more detailed documentation, visit
[Tambo's official docs](https://docs.tambo.co).
