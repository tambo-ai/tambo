<div align="center">
  <img src="assets/octo-white-background-rounded.png" width="150">
  <h1>Tambo AI</h1>
  <p>Turn your app into a natural language interface in minutes, not weeks.</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@tambo-ai/react"><img src="https://img.shields.io/npm/v/%40tambo-ai%2Freact?logo=npm" alt="npm version" /></a>
  <a href="https://github.com/tambo-ai/tambo/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tambo-ai/tambo" alt="License" /></a>
  <a href="https://github.com/tambo-ai/tambo/commits/main"><img src="https://img.shields.io/github/last-commit/tambo-ai/tambo" alt="Last Commit" /></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1251581895414911016?color=7289da&label=discord" alt="Discord"></a>
  <a href="https://github.com/tambo-ai/tambo"><img src="https://img.shields.io/github/stars/tambo-ai/tambo" alt="GitHub stars" /></a>
</p>

<p align="center">
  <a href="https://docs.tambo.co/getting-started/quickstart">Quick Start</a> •
  <a href="https://docs.tambo.co">Documentation</a> •
  <a href="https://ui.tambo.co">Component Library</a> •
  <a href="https://discord.gg/dJNvPEHth6">Discord</a>
</p>

---

## What is Tambo?

Tambo turns your React components into an AI-powered interface that responds to natural language.

https://github.com/user-attachments/assets/8381d607-b878-4823-8b24-ecb8053bef23

## Why Tambo?

Natural language is the final interface evolution—users describe what they want, your app responds with the right UI and actions. No learning curve, just conversation.

Tambo brings this to React.

## Key Benefits

- **Bring Your Own Components** - [Register your existing React components](#how-tambo-works) with type-safe schemas. AI renders and updates them dynamically. Explore our [pre-built component library](https://ui.tambo.co).
- **MCP & Custom Tools** - Native [Model Context Protocol](#mcp-servers) support plus [custom tool registration](#custom-tools) for your APIs and business logic.
- **Smart Context** - Add [additional context](#additional-context) about user state, enable [auto-generated suggestions](#suggestions), and integrate [user authentication](#user-authentication) for personalized experiences.
- **Type-Safe & Multi-Provider** - Full TypeScript + Zod validation. Works with [multiple LLM providers](#supported-llm-providers) including OpenAI, Anthropic, Gemini, and Mistral.
- **Advanced Rendering** - Track [streaming status](#streaming-status) for progressive component loading and fine-grained rendering control.
- **Open Source** - MIT licensed SDK and backend. [Self-host your own infrastructure](#self-hosting-mit-licensed) or use our hosted cloud service.

## Get Started in 5 Minutes

```bash
# 1. Create your app
npx tambo create-app my-tambo-app
cd my-tambo-app

# 2. Choose your deployment (cloud or self-hosted)
npx tambo init

# 3. Start building
npm run dev
```

Choose your deployment:

- **Tambo Cloud** - Free hosted service (sign up for API key)
- **Self-hosted** - Run your own backend (free, no ongoing costs)

**📦 [Pre-built component library](https://ui.tambo.co)** - Ready-made primitives for every generative UI pattern. Start fast, customize everything.

https://github.com/user-attachments/assets/6cbc103b-9cc7-40f5-9746-12e04c976dff

## How Tambo Works

Tambo supports two component types:

### Generative Components

AI creates and renders these from scratch in response to user messages. Best for dynamic, one-time UI generation.

https://github.com/user-attachments/assets/6cbc103b-9cc7-40f5-9746-12e04c976dff

### Interactable Components

Components that persist on the page and update by ID across conversations. Pre-place them in your code or have AI generate and place them in the Dom for future updates.

https://github.com/user-attachments/assets/12d957cd-97f1-488e-911f-0ff900ef4062

---

### 1. Register Your Components

Define which React components the AI can use, with descriptions and type-safe prop schemas:

**Generative Components:**

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

**Interactable Components:**

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

https://github.com/user-attachments/assets/3bd340e7-e226-4151-ae40-aab9b3660d8b

<p align="center">
  <a href="https://docs.tambo.co/getting-started/quickstart">→ Read the full tutorial</a>
</p>

## Key Features

### Custom Tools

Register functions to fetch data, perform calculations, or integrate external services from AI conversations.

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

Connect to ready-made integrations (Linear, Slack, databases) using the Model Context Protocol.

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

https://github.com/user-attachments/assets/c7a13915-8fed-4758-be1b-30a60fad0cda

Supported MCP features:

- **Tools** - Call functions from MCP servers
- **Prompts** - Insert predefined prompt templates
- **Elicitations** - Request user input during tool execution
- **Sampling** - LLM completions (server-side only)

[→ MCP documentation](https://docs.tambo.co/concepts/model-context-protocol)

### Additional Context

Enrich AI responses by sending metadata about user state, app settings, or environment—like shopping cart contents, user roles, current page, feature flags, or geolocation.

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

Track which component props have loaded for progressive rendering and fine-grained control.

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

### Supported LLM Providers

Tambo works with multiple AI providers out of the box:

- **OpenAI** (GPT-4.1, GPT-5, O3, and more)
- **Anthropic** (Claude 3.5/4)
- **Google Gemini** (1.5 Pro, 2.0 Flash)
- **Mistral** (Large, Medium, Magistral)
- Custom OpenAI-compatible providers

[→ Learn more](https://docs.tambo.co/models)

<p align="center">
  <a href="https://docs.tambo.co">→ See full documentation</a>
</p>

---

## Pricing & Deployment

### Self-Hosting (MIT Licensed)

Run your own Tambo backend - completely free, no ongoing costs.

**Quick setup:**

```bash
npx tambo init
# Select "Self-hosted" and follow the prompts
```

### Hosted Service (Fastest)

- **Free**: 10,000 messages/month
- **Growth**: $25/mo - 200k messages + email support
- **Enterprise**: Custom volume, SLA, SOC 2, HIPAA

[View full pricing →](https://tambo.co/pricing)

## Templates

| Template                                                                 | Description                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [AI Chat with Generative UI](https://github.com/tambo-ai/tambo-template) | Full-featured chat interface with dynamic component generation     |
| [AI Analytics Dashboard](https://github.com/tambo-ai/analytics-template) | Interactive analytics dashboard with AI-powered data visualization |

More templates coming soon. [Request a template →](https://github.com/tambo-ai/tambo/issues)

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
  <b>Build AI-powered interfaces. Ship faster.</b>
</p>

<p align="center">
  <img src="assets/tambo-animation.gif" alt="Tambo AI Animation" width="800">
</p>

---

**Note for AI/LLM agents:** For comprehensive documentation in a format optimized for language models, visit [docs.tambo.co/llms.txt](https://docs.tambo.co/llms.txt)
