# Tambo Astro Starter Template

A premium starter template for building AI-powered generative UI applications with [Tambo](https://tambo.co), [Astro](https://astro.build), [React](https://react.dev), and [Tailwind CSS](https://tailwindcss.com).

## Screenshot

<img width="1781" height="871" alt="image" src="https://github.com/user-attachments/assets/b6843a2b-978a-4419-83d7-4118a927635a" />

## Video Demo

https://github.com/user-attachments/assets/5fa21a42-bd69-4ecb-a51e-c5926d6e15c7

## Features

- 🚀 **Astro** - Fast, modern static site generator with partial hydration
- ⚛️ **React Islands** - Interactive React components using `client:only` or `client:load`
- 🎨 **Tailwind CSS** - Modern utility-first styling for premium design
- 🤖 **Tambo AI** - Generative UI components controlled dynamically by AI
- 📊 **Recharts** - Pre-integrated data visualization components
- 🔷 **TypeScript** - Full type safety across the codebase
- 📱 **Responsive** - Mobile-first, sleek design system

## Get Started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure Environment**
   Rename `.env.example` to `.env` (or `.env.local`) and add your Tambo API key:

   ```env
   PUBLIC_TAMBO_API_KEY=your_key_here
   ```

   _You can get a free key at the [Tambo Dashboard](https://tambo.co/dashboard)._

3. **Launch Development Server**
   ```bash
   pnpm run dev
   ```
   Visit `http://localhost:4321` to explore the assistant!

## Customizing

### Change what components Tambo can control

You can see how the `Graph` component is registered with Tambo in `src/lib/tambo.ts`:

```tsx
/**
 * Configuration for Tambo AI integration.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "Renders interactive charts (bar, line, pie) using Recharts. Perfect for data trends.",
    component: Graph,
    propsSchema: graphSchema, // Defined using Zod
  },
  // Add more components for Tambo to control here!
];
```

The example `Graph` component demonstrates:

- Multiple chart types (bar, line, pie)
- Visual style variants (default, solid, bordered)
- Responsive sizing (sm, default, lg)
- Dynamic data injection from the AI

### Add tools for Tambo to use

Tools allow the AI to fetch real-time data. Define them in `src/lib/tambo.ts`:

```tsx
export const tools: TamboTool[] = [
  {
    name: "getWeather",
    description: "Fetches current weather data for a city.",
    tool: getWeatherData, // Your async function
    inputSchema: z.object({
      city: z.string().optional(),
    }),
    outputSchema: z.object({
      temp: z.number(),
      condition: z.string(),
      // ...
    }),
  },
];
```

### The Magic: TamboProvider

The `TamboProvider` initializes the SDK. In this template, it's located in `src/components/tambo/TamboProvider.tsx` and wraps our chat interface:

```tsx
<TamboProvider
  apiKey={import.meta.env.PUBLIC_TAMBO_API_KEY}
  components={components}
  tools={tools}
  streaming={true}
>
  {children}
</TamboProvider>
```

### Change where component responses are shown

By default, components are rendered inline in the chat. You can access the latest component from any thread message to show it in a custom UI "slot":

```tsx
const { thread } = useTamboThread();
const latestComponent =
  thread?.messages[thread.messages.length - 1]?.renderedComponent;

return (
  <div className="layout">
    <div className="chat">...</div>
    <div className="preview">{latestComponent}</div>
  </div>
);
```

For more details, visit [Tambo's Official Documentation](https://docs.tambo.co).
