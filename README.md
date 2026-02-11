<div align="center">
  <img src="assets/octo-white-background-rounded.png" width="150">
  <h1>Tambo AI</h1>
  <h3>Build agents that speak your UI</h3>
  <p>The open-source generative UI toolkit for React. Connect your components—Tambo handles streaming, state management, and MCP.</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@tambo-ai/react"><img src="https://img.shields.io/npm/v/%40tambo-ai%2Freact?logo=npm" alt="npm version" /></a>
  <a href="https://github.com/tambo-ai/tambo/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tambo-ai/tambo" alt="License" /></a>
  <a href="https://github.com/tambo-ai/tambo/commits/main"><img src="https://img.shields.io/github/last-commit/tambo-ai/tambo" alt="Last Commit" /></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1251581895414911016?color=7289da&label=discord" alt="Discord"></a>
  <a href="https://github.com/tambo-ai/tambo"><img src="https://img.shields.io/github/stars/tambo-ai/tambo" alt="GitHub stars" /></a>
</p>

<p align="center">
  <a href="https://trendshift.io/repositories/15734" target="_blank" rel="noopener noreferrer"><img src="https://trendshift.io/api/badge/repositories/15734" alt="tambo-ai/tambo | Trendshift" width="250" height="55" /></a>
</p>

<p align="center">
<a href="https://tambo.link/yXkF0hQ">Start For Free</a> •
  <a href="https://docs.tambo.co">Docs</a> •
  <a href="https://discord.gg/dJNvPEHth6">Discord</a>
</p>

---

> **Tambo 1.0 is here!** Read the announcement: [Introducing Tambo: Generative UI for React](https://tambo.co/blog/posts/introducing-tambo-generative-ui)

---

## Table of Contents

- [What is Tambo?](#what-is-tambo)
- [Get Started](#get-started)
- [How It Works](#how-it-works)
- [Features](#features)
- [How Tambo Compares](#how-tambo-compares)
- [Community](#community)
- [License](#license)

## What is Tambo?

Tambo is a React toolkit for building agents that render UI (also known as generative UI).

Register your components with Zod schemas. The agent picks the right one and streams the props so users can interact with them. "Show me sales by region" renders your `<Chart>`. "Add a task" updates your `<TaskBoard>`.

**[Get started in 5 minutes →](#get-started)**

https://github.com/user-attachments/assets/8381d607-b878-4823-8b24-ecb8053bef23

### What's Included

Tambo is a fullstack solution for adding generative UI to your app. You get a React SDK plus a backend that handles conversation state and agent execution.

**1. Agent included** — Tambo runs the LLM conversation loop for you. Bring your own API key (OpenAI, Anthropic, Gemini, Mistral, or any OpenAI-compatible provider). Works with agent frameworks like LangChain and Mastra, but they're not required.

**2. Streaming infrastructure** — Props stream to your components as the LLM generates them. Cancellation, error recovery, and reconnection are handled for you.

**3. Tambo Cloud or self-host** — Cloud is a hosted backend that manages conversation state and agent orchestration. Self-hosted runs the same backend on your infrastructure via Docker.

Most software is built around a one-size-fits-all mental model. We built Tambo to help developers build software that adapts to users.

## Get Started

```bash
npm create tambo-app my-tambo-app  # auto-initializes git + tambo setup
cd my-tambo-app
npm run dev
```

[**Tambo Cloud**](https://tambo.link/yXkF0hQ) is a hosted backend, free to get started with plenty of credits to start building. **Self-hosted** runs on your own infrastructure.

Check out the [pre-built component library](https://ui.tambo.co) for agent and generative UI primitives:

https://github.com/user-attachments/assets/6cbc103b-9cc7-40f5-9746-12e04c976dff

Or fork a template:

| Template                                                                 | Description                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| [AI Chat with Generative UI](https://github.com/tambo-ai/tambo-template) | Chat interface with dynamic component generation  |
| [AI Analytics Dashboard](https://github.com/tambo-ai/analytics-template) | Analytics dashboard with AI-powered visualization |

## How It Works

Tell the AI which components it can use. Zod schemas define the props. These schemas become LLM tool definitions—the agent calls them like functions and Tambo renders the result.

### Generative Components

Render once in response to a message. Charts, summaries, data visualizations.

https://github.com/user-attachments/assets/3bd340e7-e226-4151-ae40-aab9b3660d8b

```tsx
const components: TamboComponent[] = [
  {
    name: "Graph",
    description: "Displays data as charts using Recharts library",
    component: Graph,
    propsSchema: z.object({
      data: z.array(z.object({ name: z.string(), value: z.number() })),
      type: z.enum(["line", "bar", "pie"]),
    }),
  },
];
```

### Interactable Components

Persist and update as users refine requests. Shopping carts, spreadsheets, task boards.

https://github.com/user-attachments/assets/12d957cd-97f1-488e-911f-0ff900ef4062

```tsx
const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description: "A note supporting title, content, and color modifications",
  propsSchema: z.object({
    title: z.string(),
    content: z.string(),
    color: z.enum(["white", "yellow", "blue", "green"]).optional(),
  }),
});
```

Docs: [generative components](https://docs.tambo.co/concepts/generative-interfaces/generative-components), [interactable components](https://docs.tambo.co/concepts/generative-interfaces/interactable-components)

### The Provider

Wrap your app with `TamboProvider`. You must provide either `userKey` or `userToken` to identify the thread owner.

```tsx
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  userKey={currentUserId}
  components={components}
>
  <Chat />
  <InteractableNote id="note-1" title="My Note" content="Start writing..." />
</TamboProvider>
```

Use `userKey` for server-side or trusted environments. Use `userToken` (OAuth access token) for client-side apps where the token contains the user identity. See [User Authentication](https://docs.tambo.co/concepts/user-authentication) for details.

Docs: [provider options](https://docs.tambo.co/reference/react-sdk/providers)

### Hooks

`useTambo()` is the primary hook — it gives you messages, streaming state, and thread management. `useTamboThreadInput()` handles user input and message submission.

```tsx
const { messages, isStreaming } = useTambo();
const { value, setValue, submit, isPending } = useTamboThreadInput();
```

Docs: [threads and messages](https://docs.tambo.co/concepts/conversation-storage), [streaming status](https://docs.tambo.co/concepts/generative-interfaces/component-state), [full tutorial](https://docs.tambo.co/getting-started/quickstart)

## Features

### MCP Integrations

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

<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  userKey={currentUserId}
  components={components}
  mcpServers={mcpServers}
>
  <App />
</TamboProvider>;
```

https://github.com/user-attachments/assets/c7a13915-8fed-4758-be1b-30a60fad0cda

Docs: [MCP integration](https://docs.tambo.co/concepts/model-context-protocol)

### Local Tools

Sometimes you need functions that run in the browser. DOM manipulation, authenticated fetches, accessing React state. Define them as tools and the AI can call them.

```tsx
const tools: TamboTool[] = [
  {
    name: "getWeather",
    description: "Fetches weather for a location",
    tool: async (params: { location: string }) =>
      fetch(`/api/weather?q=${encodeURIComponent(params.location)}`).then((r) =>
        r.json(),
      ),
    inputSchema: z.object({
      location: z.string(),
    }),
    outputSchema: z.object({
      temperature: z.number(),
      condition: z.string(),
      location: z.string(),
    }),
  },
];

<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  userKey={currentUserId}
  tools={tools}
  components={components}
>
  <App />
</TamboProvider>;
```

Docs: [local tools](https://docs.tambo.co/guides/take-actions/register-tools)

### Context, Auth, and Suggestions

**Additional context** lets you pass metadata to give the AI better responses. User state, app settings, current page. **User authentication** passes tokens from your auth provider. **Suggestions** generates prompts users can click based on what they're doing.

```tsx
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
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

Docs: [additional context](https://docs.tambo.co/concepts/additional-context), [user authentication](https://docs.tambo.co/concepts/user-authentication), [suggestions](https://docs.tambo.co/concepts/suggestions)

### Supported LLM Providers

OpenAI, Anthropic, Cerebras, Google Gemini, Mistral, and any OpenAI-compatible provider. [Full list](https://docs.tambo.co/reference/llm-providers). Missing one? [Let us know](https://github.com/tambo-ai/tambo/issues).

## How Tambo Compares

| Feature                            | Tambo                                 | Vercel AI SDK                    | CopilotKit                       | Assistant UI         |
| ---------------------------------- | ------------------------------------- | -------------------------------- | -------------------------------- | -------------------- |
| **Component selection**            | AI decides which components to render | Manual tool-to-component mapping | Via agent frameworks (LangGraph) | Chat-focused tool UI |
| **MCP integration**                | Built-in                              | Experimental (v4.2+)             | Recently added                   | Requires AI SDK v5   |
| **Persistent stateful components** | Yes                                   | No                               | Shared state patterns            | No                   |
| **Client-side tool execution**     | Declarative, automatic                | Manual via onToolCall            | Agent-side only                  | No                   |
| **Self-hostable**                  | MIT (SDK + backend)                   | Apache 2.0 (SDK only)            | MIT                              | MIT                  |
| **Hosted option**                  | Tambo Cloud                           | No                               | CopilotKit Cloud                 | Assistant Cloud      |
| **Best for**                       | Full app UI control                   | Streaming and tool abstractions  | Multi-agent workflows            | Chat interfaces      |

## Community

Join the [Discord](https://discord.gg/dJNvPEHth6) to chat with other developers and the core team.

Interested in contributing? Read the [Contributing Guide](./CONTRIBUTING.md).

Join the conversation on Twitter and follow [@tambo_ai](https://twitter.com/tambo_ai).

## License

[MIT](LICENSE) unless otherwise noted. Some workspaces (like `apps/api`) are [Apache-2.0](apps/api/LICENSE).

---

<p align="center">
  <img src="assets/tambo-animation.gif" alt="Tambo AI Animation" width="800">
</p>

**For AI/LLM agents:** [docs.tambo.co/llms.txt](https://docs.tambo.co/llms.txt)
