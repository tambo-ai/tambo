<div align="center">
  <h1>@tambo-ai/react</h1>
  <h3>Generative UI for React</h3>
  <p>Build apps that adapt to your users.</p>
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

## What is Tambo?

Tambo is a generative UI SDK for React. Register your components, and the AI decides which ones to render based on natural language conversations.

## Why We Built This

Most software is built around a one-size-fits-all mental model that doesn't fit every user.

**Users shouldn't have to learn your app.** Generative UI shows the right components based on what someone is trying to do. First-time users and power users see different things.

**Users shouldn't have to click through your workflows.** "Show me sales from last quarter grouped by region" should just work. The AI translates what users want into the right interface.

```tsx
const components: TamboComponent[] = [{
  name: "Graph",
  description: "Displays data as charts",
  component: Graph,
  propsSchema: z.object({ data: z.array(...), type: z.enum(["line", "bar", "pie"]) })
}];
```

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
import { z } from "zod/v4";

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

**Generative components** render once in response to a message. Charts, summaries, data visualizations.

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

**Interactable components** persist and update as users refine requests. Shopping carts, spreadsheets, task boards.

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

Connect to Linear, Slack, databases, or your own MCP servers. Tambo supports the full MCP protocol: tools, prompts, elicitations, and sampling.

```tsx
import { MCPTransport } from "@tambo-ai/react/mcp";

const mcpServers = [
  {
    name: "filesystem",
    url: "http://localhost:8261/mcp",
    transport: MCPTransport.HTTP,
  },
];

<TamboProvider components={components} mcpServers={mcpServers}>
  <App />
</TamboProvider>;
```

[→ Learn more about MCP](https://docs.tambo.co/concepts/model-context-protocol)

> **Dependency note**
>
> The `@modelcontextprotocol/sdk` is included automatically when you install `@tambo-ai/react`. However, if you import from the `@tambo-ai/react/mcp` subpath and use features that require schema validation (like component props schemas), you'll need to install `zod` and `zod-to-json-schema` as optional peer dependencies:
>
> ```bash
> npm install zod@^4.0.0 zod-to-json-schema@^3.25.0
> ```
>
> `zod` can also be `^3.25` if you prefer Zod 3; both `^3.25` and `^4.0` satisfy the SDK's `zod/v3` subpath constraints.

### Local Tools

Sometimes you need functions that run in the browser. DOM manipulation, authenticated fetches, accessing React state. Define them as tools and the AI can call them.

```tsx
import { z } from "zod/v4";
import { defineTool } from "@tambo-ai/react";

const tools = [
  defineTool({
    name: "getWeather",
    description: "Fetches weather data for a location",
    tool: async ({ location }) =>
      fetch(`/api/weather?q=${location}`).then((r) => r.json()),
    inputSchema: z.object({
      location: z.string(),
    }),
    outputSchema: z.object({
      temperature: z.number(),
      condition: z.string(),
      location: z.string(),
    }),
  }),
];

<TamboProvider tools={tools} components={components}>
  <App />
</TamboProvider>;
```

[→ Learn more about tools](https://docs.tambo.co/concepts/tools/adding-tools)

#### Advanced: Transforming Tool Responses

For tools that return rich content (images, audio, mixed media), provide a `transformToContent` function:

```tsx
const tools: TamboTool[] = [
  {
    name: "getImageData",
    description: "Fetches image data with metadata",
    tool: async (params: { imageId: string }) => {
      const data = await fetchImageData(params.imageId);
      return { url: data.imageUrl, description: data.description };
    },
    inputSchema: z.object({
      imageId: z.string(),
    }),
    outputSchema: z.object({ url: z.string(), description: z.string() }),
    transformToContent: (result) => [
      { type: "text", text: result.description },
      { type: "image_url", image_url: { url: result.url } },
    ],
  },
];
```

The MCP integration automatically uses `transformToContent` to pass through rich content.

### Local Resources

Resources provide context to the AI by making content accessible without requiring a full MCP server. You can register static resources, dynamic resource functions, or both.

#### Static Resources

Register individual resources directly in your provider:

```tsx
import { type ListResourceItem } from "@tambo-ai/react";

const resources: ListResourceItem[] = [
  {
    uri: "file:///config/app-settings.json",
    name: "App Settings",
    description: "Current application configuration",
    mimeType: "application/json",
  },
  {
    uri: "file:///docs/user-guide.md",
    name: "User Guide",
    description: "Getting started documentation",
    mimeType: "text/markdown",
  },
];

<TamboProvider resources={resources}>
  <App />
</TamboProvider>;
```

#### Dynamic Resources

For resources that need to be fetched or computed at runtime, provide `listResources` and `getResource` functions:

```tsx
import { type ResourceSource, type ReadResourceResult } from "@tambo-ai/react";

const listResources = async (search?: string) => {
  const allDocs = await fetchUserDocuments();
  return allDocs
    .filter((doc) => !search || doc.name.includes(search))
    .map((doc) => ({
      uri: `file:///docs/${doc.id}`,
      name: doc.name,
      description: doc.summary,
      mimeType: "text/markdown",
    }));
};

const getResource = async (uri: string): Promise<ReadResourceResult> => {
  const docId = uri.split("/").pop();
  const content = await fetchDocumentContent(docId);
  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text: content,
      },
    ],
  };
};

<TamboProvider listResources={listResources} getResource={getResource}>
  <App />
</TamboProvider>;
```

**Important:** Both `listResources` and `getResource` must be provided together - you cannot provide one without the other.

#### Programmatic Registration

You can also register resources programmatically:

```tsx
const { registerResource, registerResourceSource } = useTamboRegistry();

// Register a single resource
registerResource({
  uri: "file:///runtime/state.json",
  name: "Application State",
  mimeType: "application/json",
});

// Register a dynamic source
registerResourceSource({
  listResources: async () => [...],
  getResource: async (uri) => ({ contents: [...] }),
});
```

#### Resource vs MCP Server

- **Local resources**: Fast, simple, runs in the browser. Great for app state, config, cached data.
- **MCP servers**: Full protocol support, server-side execution. Use for databases, APIs, external services.

Local resources appear in `useTamboMcpResourceList()` alongside MCP resources, with MCP resources always prefixed by their serverKey.

[→ Learn more about resources](https://docs.tambo.co/concepts/resources)

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

### Context, Auth, and Suggestions

**Additional context** lets you pass metadata to give the AI better responses. User state, app settings, current page. **User authentication** passes tokens from your auth provider. **Suggestions** generates prompts users can click based on what they're doing.

```tsx
<TamboProvider
  userToken={userToken}
  contextHelpers={{
    selectedItems: () => ({
      key: "selectedItems",
      value: selectedItems.map((i) => i.name).join(", "),
    }),
    currentPage: () => ({ key: "page", value: window.location.pathname }),
  }}
/>
```

```tsx
const { suggestions, accept } = useTamboSuggestions({ maxSuggestions: 3 });

suggestions.map((s) => (
  <button key={s.id} onClick={() => accept(s)}>
    {s.title}
  </button>
));
```

[→ Learn more](https://docs.tambo.co/concepts/additional-context) • [User authentication](https://docs.tambo.co/concepts/user-authentication) • [Suggestions](https://docs.tambo.co/concepts/suggestions)

### Supported LLM Providers

OpenAI, Anthropic, Google Gemini, Mistral, Groq, and any OpenAI-compatible provider. [Full list](https://docs.tambo.co/models). Missing one? [Let us know](https://github.com/tambo-ai/tambo/issues).

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
