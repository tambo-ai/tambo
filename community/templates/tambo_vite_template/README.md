# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# Tambo Vite Template

This is a starter Vite + React app with Tambo integrated to jumpstart your AI app development.

## Get Started

1. Run `npm create-tambo@latest my-tambo-app` for a new project

2. `npm install`

3. `npx tambo init`

- Or rename `example.env.local` to `.env.local` and add your Tambo API key (get one for free [here](https://tambo.co/dashboard)).

4. Run `npm run dev` and go to `localhost:5173` to use the app!

## Customizing

### Change what components Tambo can control

Components are registered in `src/lib/tambo.ts`:

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

The example Graph component demonstrates:

- Different prop types (strings, arrays, enums, nested objects)
- Multiple chart types (bar, line, pie)
- Customizable styling (variants, sizes)
- Optional configurations (title, legend, colors)
- Data visualization capabilities

Update the `components` array with any component(s) you want Tambo to be able to use in a response!

More info: [Generative Components](https://docs.tambo.co/concepts/generative-interfaces/generative-components)

### Add tools for Tambo to use

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

More info: [Tools](https://docs.tambo.co/concepts/tools)

### The Magic of Tambo Requires the TamboProvider

Wrap your app with `TamboProvider`:

```tsx
<TamboProvider
  apiKey={import.meta.env.VITE_TAMBO_API_KEY!}
  components={components}
  tools={tools}
>
  {children}
</TamboProvider>
```

In this template, this is done in `src/App.tsx`, but you can do it anywhere in your app.

### Voice input

The template includes a `DictationButton` component using the `useTamboVoice` hook for speech-to-text input.

### MCP (Model Context Protocol)

MCP support is included for connecting to external tools and resources. Use the MCP hooks from `@tambo-ai/react/mcp`:

- `useTamboMcpPromptList` - List available prompts from MCP servers
- `useTamboMcpPrompt` - Get a specific prompt
- `useTamboMcpResourceList` - List available resources

See `src/components/tambo/mcp-components.tsx` for examples.

### Change where component responses are shown

Tambo components are shown alongside the message response in the chat thread, but you can render them anywhere by accessing the latest thread message’s `renderedComponent`:

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
