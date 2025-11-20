<div align="center">
  <h1>@tambo-ai/react</h1>
  <h3>The core React SDK for generative UI</h3>
  <p>Register your components once. The AI decides which to render and what props to pass based on user conversations.</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@tambo-ai/react"><img src="https://img.shields.io/npm/v/%40tambo-ai%2Freact?logo=npm" alt="npm version" /></a>
  <a href="https://github.com/tambo-ai/tambo/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tambo-ai/tambo" alt="License" /></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1251581895414911016?color=7289da&label=discord" alt="Discord"></a>
</p>

<p align="center">
  <a href="https://docs.tambo.co">Documentation</a> •
  <a href="https://docs.tambo.co/api-reference">API Reference</a> •
  <a href="https://discord.gg/dJNvPEHth6">Discord</a>
</p>

---

## Overview

The `@tambo-ai/react` package provides React hooks and providers for building generative UI applications. The AI dynamically decides which components to render and what props to pass based on natural language conversations.

**MCP-native** from the ground up — integrates the Model Context Protocol (MCP) for seamless integrations with databases, APIs, files, and external systems.

## Why Use This SDK?

You don't want to write 200 lines of boilerplate to show a chart.

Tambo handles:

- ✅ AI orchestration (which component to render)
- ✅ Streaming (progressive prop updates)
- ✅ State management (persistence across conversation)
- ✅ Error handling (retries, fallbacks)
- ✅ Tool coordination (MCP servers, local functions)

You write:

- Your existing React components
- Zod schemas for props
- React hooks for advanced AI features

That's the entire API.

## Key Benefits

- **No AI Expertise Needed** - If you can write React, you can build generative UIs
- **MCP-Native Architecture** - Built-in Model Context Protocol support
- **Bring Your Own LLM** - Works with OpenAI, Anthropic, Google, Mistral, or any OpenAI-compatible provider
- **Dual Build Output** - CommonJS and ESM modules for broad compatibility
- **Type-Safe** - Full TypeScript support with Zod schemas

## Installation

### Create New App

```bash
npx tambo create-app my-tambo-app
cd my-tambo-app
npm run dev
```

### Add to Existing Project

```bash
npm install @tambo-ai/react
# or
yarn add @tambo-ai/react
```

Then initialize:

```bash
npx tambo init
```

## Quick Start

```tsx
import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { z } from "zod";

// 1. Register your components
const components = [
  {
    name: "Graph",
    description: "Displays data as charts (bar, line, pie)",
    component: Graph,
    propsSchema: z.object({
      data: z.array(z.object({ name: z.string(), value: z.number() })),
      type: z.enum(["line", "bar", "pie"]),
    }),
  },
];

// 2. Wrap your app
function App() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
    >
      <ChatInterface />
    </TamboProvider>
  );
}

// 3. Use hooks to build your UI
function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  return (
    <div>
      {thread.messages.map((message) => (
        <div key={message.id}>
          {Array.isArray(message.content) ? (
            message.content.map((part, i) =>
              part.type === "text" ? <p key={i}>{part.text}</p> : null,
            )
          ) : (
            <p>{String(message.content)}</p>
          )}
          {message.renderedComponent}
        </div>
      ))}
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => submit()} disabled={isPending}>
        Send
      </button>
    </div>
  );
}
```

[→ Full tutorial](https://docs.tambo.co/getting-started/quickstart)

## Core Concepts

### Component Registration

Register React components with Zod schemas for type-safe props:

```tsx
import { type TamboComponent } from "@tambo-ai/react";

const components: TamboComponent[] = [
  {
    name: "WeatherCard",
    description: "Displays weather information with temperature and conditions",
    component: WeatherCard,
    propsSchema: z.object({
      location: z.string(),
      temperature: z.number(),
      condition: z.string(),
    }),
  },
];
```

[→ Learn more about components](https://docs.tambo.co/concepts/components)

### Provider Setup

Wrap your app with `TamboProvider` to enable AI capabilities:

```tsx
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  components={components}
  tools={tools} // optional
  userToken={userToken} // optional
>
  <YourApp />
</TamboProvider>
```

[→ See all provider options](https://docs.tambo.co/api-reference/tambo-provider)

### Hooks

| Hook                       | Description                                        |
| -------------------------- | -------------------------------------------------- |
| `useTamboThread()`         | Access current thread and messages                 |
| `useTamboThreadInput()`    | Handle user input and message submission           |
| `useTamboCurrentMessage()` | Access current message context (inside components) |
| `useTamboComponentState()` | Persistent component state across renders          |
| `useTamboStreamStatus()`   | Monitor streaming status for progressive loading   |
| `useTamboSuggestions()`    | Generate contextual suggestions                    |

[→ API Reference](https://docs.tambo.co/api-reference)

## Key Features

### Generative Components

AI renders these once in response to user messages. Best for charts, data visualizations, and summary cards.

```tsx
const components: TamboComponent[] = [
  {
    name: "Graph",
    description: "Displays data as charts",
    component: Graph,
    propsSchema: z.object({
      data: z.array(z.object({ name: z.string(), value: z.number() })),
      type: z.enum(["line", "bar", "pie"]),
    }),
  },
];
```

[→ Learn more about components](https://docs.tambo.co/concepts/components)

### Interactable Components

Components that persist on the page and update by ID across conversations. Perfect for shopping carts, spreadsheets, task boards, or dashboards.

```tsx
import { withInteractable } from "@tambo-ai/react";

const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description: "A note supporting title, content, and color modifications",
  propsSchema: z.object({
    title: z.string(),
    content: z.string(),
    color: z.enum(["white", "yellow", "blue", "green"]).optional(),
  }),
});

// Pre-place in your UI or let AI generate dynamically
<InteractableNote id="note-1" title="My Note" content="Content here" />;
```

[→ Learn more about interactable components](https://docs.tambo.co/concepts/components/interactable-components)

### MCP Integration

Connect to external systems using the Model Context Protocol:

```tsx
import { TamboMcpProvider, MCPTransport } from "@tambo-ai/react/mcp";

const mcpServers = [
  {
    name: "filesystem",
    url: "http://localhost:3001/mcp",
    transport: MCPTransport.HTTP,
  },
];

<TamboProvider components={components} mcpServers={mcpServers}>
  <TamboMcpProvider>
    <App />
  </TamboMcpProvider>
</TamboProvider>;
```

Supports full MCP protocol: tools, prompts, elicitations, and sampling. Client-side or server-side execution.

[→ Learn more about MCP](https://docs.tambo.co/concepts/model-context-protocol)

### Local Tools

Write JavaScript functions that execute in your React app:

```tsx
import { type TamboTool } from "@tambo-ai/react";

const tools: TamboTool[] = [
  {
    name: "getWeather",
    description: "Fetches weather data for a location",
    tool: async (location: string) =>
      fetch(`/api/weather?q=${location}`).then((r) => r.json()),
    toolSchema: z
      .function()
      .args(z.string())
      .returns(
        z.object({
          temperature: z.number(),
          condition: z.string(),
          location: z.string(),
        }),
      ),
  },
];

<TamboProvider tools={tools} components={components}>
  <App />
</TamboProvider>;
```

**When to use:** DOM interactions, wrapping authenticated fetch requests, or accessing React state. Runs entirely in the browser.

[→ Learn more about tools](https://docs.tambo.co/concepts/tools)

#### Advanced: Transforming Tool Responses

For tools that return rich content (images, audio, mixed media), provide a `transformToContent` function:

```tsx
const tools: TamboTool[] = [
  {
    name: "getImageData",
    description: "Fetches image data with metadata",
    tool: async (imageId: string) => {
      const data = await fetchImageData(imageId);
      return { url: data.imageUrl, description: data.description };
    },
    toolSchema: z
      .function()
      .args(z.string())
      .returns(z.object({ url: z.string(), description: z.string() })),
    transformToContent: (result) => [
      { type: "text", text: result.description },
      { type: "image_url", image_url: { url: result.url } },
    ],
  },
];
```

The MCP integration automatically uses `transformToContent` to pass through rich content.

### Streaming Status

Monitor streaming status for progressive loading:

```tsx
import { useTamboStreamStatus } from "@tambo-ai/react";

function LoadingComponent({ title, data }) {
  const { streamStatus, propStatus } = useTamboStreamStatus();

  // Show spinner until complete
  if (!streamStatus.isSuccess) return <Spinner />;

  // Or show each prop as it arrives
  return (
    <div>
      {propStatus["title"]?.isSuccess && <h3>{title}</h3>}
      {propStatus["data"]?.isSuccess && <Chart data={data} />}
    </div>
  );
}
```

[→ Learn more about streaming](https://docs.tambo.co/concepts/streaming/component-streaming-status)

### Additional Context

Send metadata about user state, app settings, or environment:

```tsx
const contextHelpers = {
  selectedItems: () => ({
    key: "selectedItems",
    value: `User has selected: ${selectedItems.map((i) => i.name).join(", ")}`,
  }),
  currentPage: () => ({
    key: "page",
    value: window.location.pathname,
  }),
};

<TamboProvider contextHelpers={contextHelpers} />;
```

[→ Learn more](https://docs.tambo.co/concepts/additional-context)

### Suggestions

Auto-generate contextual suggestions:

```tsx
import { useTamboSuggestions } from "@tambo-ai/react";

function SuggestionsList() {
  const { suggestions, accept } = useTamboSuggestions({ maxSuggestions: 3 });

  return suggestions.map((s) => (
    <button key={s.id} onClick={() => accept(s)}>
      {s.title}
    </button>
  ));
}
```

[→ Learn more](https://docs.tambo.co/concepts/suggestions)

## When to Use This SDK

Use `@tambo-ai/react` directly when you need:

- **Custom implementations** - Build your own chat interface or UI patterns
- **Existing design systems** - Integrate with your component library
- **Fine-grained control** - Customize rendering, state, and behavior
- **Non-Next.js frameworks** - Works with any React setup

For quick starts with pre-built components, use:

- `npx tambo create-app` - Full-featured template with UI components
- [Tambo UI Library](https://ui.tambo.co) - Copy/paste production-ready components

## Build Output

This package provides dual build outputs for broad compatibility:

- **CommonJS** (`dist/`) - For Node.js and older bundlers
- **ESM** (`esm/`) - For modern bundlers and native ES modules

TypeScript definitions included for both outputs.

## Community & Support

- **Discord:** [Join our community](https://discord.gg/dJNvPEHth6) for help and discussions
- **GitHub:** [Star the repo](https://github.com/tambo-ai/tambo) and contribute
- **Showcase:** See [projects built with Tambo](https://github.com/tambo-ai/tambo#built-with-tambo)

## Documentation

- [Full Documentation](https://docs.tambo.co)
- [Getting Started Guide](https://docs.tambo.co/getting-started/quickstart)
- [API Reference](https://docs.tambo.co/api-reference)
- [Component Guides](https://docs.tambo.co/concepts/components)
- [UI Library](https://ui.tambo.co)

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Note for AI/LLM agents:** For comprehensive documentation in a format optimized for language models, visit [docs.tambo.co/llms.txt](https://docs.tambo.co/llms.txt)
