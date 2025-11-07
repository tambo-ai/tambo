<div align="center">
  <img src="assets/octo-white-background-rounded.png" width="150">
  <h1>Tambo AI</h1>
  <p><b>Build AI-powered applications with generative UI in minutes, not weeks.</b></p>
  <p>Turn your app into a natural language interface with a few lines of React.</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@tambo-ai/react"><img src="https://img.shields.io/npm/v/%40tambo-ai%2Freact?logo=npm" alt="npm version" /></a>
  <a href="https://github.com/tambo-ai/tambo/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tambo-ai/tambo" alt="License" /></a>
  <a href="https://github.com/tambo-ai/tambo/commits/main"><img src="https://img.shields.io/github/last-commit/tambo-ai/tambo" alt="Last Commit" /></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1287802361845788802?logo=discord&label=Discord" alt="Discord" /></a>
  <a href="https://github.com/tambo-ai/tambo"><img src="https://img.shields.io/github/stars/tambo-ai/tambo" alt="GitHub stars" /></a>
</p>

<p align="center">
  <a href="https://docs.tambo.co/getting-started/quickstart">Quick Start</a> •
  <a href="https://docs.tambo.co">Documentation</a> •
  <a href="https://ui.tambo.co">Component Library</a> •
  <a href="https://discord.gg/dJNvPEHth6">Discord</a>
</p>

---

## What You Can Build

Combine the power of graphical user interfaces with AI to help users discover and work with your application.

https://github.com/user-attachments/assets/8381d607-b878-4823-8b24-ecb8053bef23

## Why Tambo?

### 🔌 MCP-Native

The first generative UI framework with native **Model Context Protocol** support. Integrate tools, prompts, and elicitations from any MCP server.

https://github.com/user-attachments/assets/c7a13915-8fed-4758-be1b-30a60fad0cda

### 🎨 Bring Your Own Components

Bring your existing UI components or build new ones. AI can generate them inline or update them dynamically.

https://github.com/user-attachments/assets/3bd340e7-e226-4151-ae40-aab9b3660d8b

### 📦 Component Library

Pre-built primitives for every generative UI pattern at [ui.tambo.co](https://ui.tambo.co). Start fast, customize everything.

https://github.com/user-attachments/assets/6cbc103b-9cc7-40f5-9746-12e04c976dff

### ⚡️ Type-Safe by Default

Built with TypeScript and Zod schemas throughout. Your AI-generated components are bulletproof with full type safety from registration to runtime.

### 🏗️ Full-Stack Open Source

Both the React SDK **and** backend ([tambo-cloud](https://github.com/tambo-ai/tambo-cloud)) are MIT licensed. No vendor lock-in, full control over your AI infrastructure.

---

## Get Started in 5 Minutes

```bash
npx tambo create-app my-tambo-app
cd my-tambo-app
npx tambo init
npm run dev
```

<p align="center">
  <a href="https://github.com/tambo-ai/tambo-template">View the AI chat template</a> •
  <a href="https://github.com/tambo-ai/analytics-template">View the analytics template</a> •
  <a href="https://ui.tambo.co">Explore pre-built components</a>
</p>
---

## How Tambo Works

Tambo has two main ways of interacting with UI:

1. **Generative:** Register components that AI can render inline with props.
2. **Interactable:** Wrap pre-placed components so AI can update their state dynamically.

### 1. Register Your Components

Define which React components the AI can use, with descriptions and type-safe prop schemas:

#### Generative Components

```tsx
import { z } from "zod";
import { TamboComponent } from "@tambo-ai/react";
import { Graph } from "./components/Graph";

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

#### Interactable Components

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
```

[→ Learn more about interactable components](https://docs.tambo.co/concepts/components/interactable-components)

### 2. Wrap Your App with TamboProvider

Set up the provider with your API key and registered components:

```tsx
import { TamboProvider } from "@tambo-ai/react";

export default function App() {
  return (
    <TamboProvider apiKey={process.env.TAMBO_API_KEY} components={components}>
      <Chat />
      <InteractableNote id="note-1" title="My Note" />
    </TamboProvider>
  );
}
```

### 3. Integrate Tambo Chat

Use our React hooks to enable natural language interaction:

#### Send a Message

```tsx
import { useTamboThreadInput } from "@tambo-ai/react";

function ChatInput() {
  const { submit } = useTamboThreadInput();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit({
          contextKey: "my-app",
        });
      }}
    >
      <input type="text" placeholder="Ask AI to generate a component..." />
      <button type="submit">Send</button>
    </form>
  );
}
```

#### Render Messages and the Generated Components

```tsx
import { useMessageContext } from "@tambo-ai/react";

function Message({ messageId }) {
  const message = useMessageContext(messageId);

  return (
    <div>
      <p>{message.content}</p>
      {message.renderedComponent}
    </div>
  );
}
```

#### Or Use Pre-Built UI Components

Skip building your own and use our [component library](https://ui.tambo.co):

https://github.com/user-attachments/assets/f86c9003-bb90-4253-8624-9919b2173491

<p align="center">
  <a href="https://docs.tambo.co/getting-started/quickstart">→ Read the full tutorial</a>
</p>

---

## Advanced Features

### Custom Tools

Register functions for AI to call:

```tsx
const tools: TamboTool[] = [
  {
    name: "getWeather",
    description: "Fetches weather for a location",
    tool: async (location: string) =>
      fetch(`/api/weather?q=${location}`).then((r) => r.json()),
    toolSchema: z.function().args(z.string()).returns(weatherSchema),
  },
];

<TamboProvider tools={tools} components={components}>
  <App />
</TamboProvider>;
```

[→ Learn more about tools](https://docs.tambo.co/concepts/tools)

### MCP Servers

Connect to Model Context Protocol servers:

```tsx
const mcpServers = [
  {
    name: "filesystem",
    url: "http://localhost:3001/mcp",
    transport: "http",
  },
];

<TamboProvider components={components}>
  <TamboMcpProvider mcpServers={mcpServers}>
    <App />
  </TamboMcpProvider>
</TamboProvider>;
```

Supported MCP features:

- **Tools** - Call functions from MCP servers
- **Prompts** - Insert predefined prompt templates
- **Elicitations** - Request user input during tool execution
- **Sampling** - LLM completions (server-side only)

[→ MCP documentation](https://docs.tambo.co/concepts/model-context-protocol)

### Additional Context

Enrich messages with contextual information:

```tsx
const selectedItemsHelper = () => ({
  key: "selectedItems",
  value: `User has selected: ${selectedItems.map((i) => i.name).join(", ")}`,
});

<TamboProvider
  contextHelpers={{
    selectedItems: selectedItemsHelper,
    currentPage: () => ({ key: "page", value: window.location.pathname }),
  }}
/>;
```

[→ Learn more](https://docs.tambo.co/concepts/additional-context)

### Streaming Status

Track component rendering state:

```tsx
const { streamStatus, propStatus } = useTamboStreamStatus();

if (!streamStatus.isSuccess) return <Spinner />;
```

[→ Learn more](https://docs.tambo.co/concepts/streaming/component-streaming-status)

### User Authentication

Pass auth tokens from your provider:

```tsx
const userToken = useUserToken();

<TamboProvider userToken={userToken}>
  <App />
</TamboProvider>;
```

[→ Learn more](https://docs.tambo.co/concepts/user-authentication)

### Suggestions

Auto-generate contextual suggestions:

```tsx
const { suggestions, accept } = useTamboSuggestions({ maxSuggestions: 3 });

suggestions.map((s) => <button onClick={() => accept(s)}>{s.title}</button>);
```

[→ Learn more](https://docs.tambo.co/concepts/suggestions)

<p align="center">
  <a href="https://docs.tambo.co">→ See full documentation</a>
</p>

---

## Comparison

How Tambo stacks up against other generative UI frameworks:

| Feature               | Tambo                                     | Other Frameworks     |
| --------------------- | ----------------------------------------- | -------------------- |
| **Component Variety** | Chat, forms, graphs, maps, canvas, custom | Mostly chat-focused  |
| **Backend**           | Open-source (MIT)                         | Closed source or DIY |
| **MCP Support**       | ✅ Native integration                     | ❌ Not available     |
| **Type Safety**       | Zod schemas throughout                    | Varies               |
| **License**           | MIT (SDK + backend)                       | Mixed                |
| **Self-Hosting**      | Full control with tambo-cloud             | Limited or none      |

---

## Templates

| Template                                                                 | Description                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [AI Chat with Generative UI](https://github.com/tambo-ai/tambo-template) | Full-featured chat interface with dynamic component generation     |
| [AI Analytics Dashboard](https://github.com/tambo-ai/analytics-template) | Interactive analytics dashboard with AI-powered data visualization |

More templates coming soon. [Request a template →](https://github.com/tambo-ai/tambo/issues)

---

## Community

Join developers building the future of AI interfaces:

- **Discord:** [Join our community](https://discord.gg/dJNvPEHth6) for help, feedback, and discussions
- **GitHub:** [Star the repo](https://github.com/tambo-ai/tambo) and contribute
- **Twitter/X:** Follow [@tambo_ai](https://twitter.com/tambo_ai) for updates

### Built with Tambo

Real projects from the community:

| Project                                                                                              | Preview                                                           | Description                                                                                                                                       | Links                                                                                      |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **[db-thing](https://db-thing.vercel.app)**<br>by [@akinloluwami](https://github.com/akinloluwami)   | <img src="community/db-thing.png" alt="db-thing" width="300">     | AI-powered database design tool. Create schemas through conversation, generate ERDs, get optimization recommendations, and export SQL migrations. | [GitHub](https://github.com/akinloluwami/db-thing) • [Demo](https://db-thing.vercel.app)   |
| **[CheatSheet](https://cheatsheet.tambo.co)**<br>by [@michaelmagan](https://github.com/michaelmagan) | <img src="community/cheatsheet.png" alt="CheatSheet" width="300"> | AI-powered spreadsheet editor. Edit cells with natural language, create charts, and connect external data through MCP.                            | [GitHub](https://github.com/michaelmagan/cheatsheet) • [Demo](https://cheatsheet.tambo.co) |

Built something with Tambo? [Open a PR](https://github.com/tambo-ai/tambo/pulls) to showcase your project here, or [share it in Discord →](https://discord.gg/dJNvPEHth6)

---

## Development

Prerequisites:

- Node.js 20.x or higher
- npm 11.x or higher

For contributing to Tambo:

```bash
git clone https://github.com/tambo-ai/tambo.git
cd tambo
npm install
turbo dev
```

Read our [Contributing Guide](./CONTRIBUTING.md) for details on development workflow, testing, and pull requests.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

Both the React SDK and backend ([tambo-cloud](https://github.com/tambo-ai/tambo-cloud)) are fully open source under MIT.

---

<p align="center">
  <img src="assets/tambo-animation.gif" alt="Tambo AI Animation" width="300">
</p>

<p align="center">
  <b>Build AI-powered interfaces. Ship faster.</b>
</p>

---

**Note for AI/LLM agents:** For comprehensive documentation in a format optimized for language models, visit [docs.tambo.co/llms.txt](https://docs.tambo.co/llms.txt)
