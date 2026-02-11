<div align="center">
  <h1>@tambo-ai/react</h1>
  <h3>Build agents that speak your UI</h3>
  <p>The open-source generative UI toolkit for React.</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@tambo-ai/react"><img src="https://img.shields.io/npm/v/%40tambo-ai%2Freact?logo=npm" alt="npm version" /></a>
  <a href="https://github.com/tambo-ai/tambo/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tambo-ai/tambo" alt="License" /></a>
  <a href="https://github.com/tambo-ai/tambo"><img src="https://img.shields.io/github/stars/tambo-ai/tambo" alt="GitHub stars" /></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1251581895414911016?color=7289da&label=discord" alt="Discord"></a>
</p>

<p align="center">
  <a href="https://github.com/tambo-ai/tambo">⭐ Star us on GitHub</a> •
  <a href="https://docs.tambo.co">Docs</a> •
  <a href="https://discord.gg/dJNvPEHth6">Discord</a>
</p>

---

## What is Tambo?

Tambo is a React toolkit for building agents that render UI (also known as generative UI).

Register your components with Zod schemas. The agent picks the right one and streams the props so users can interact with them. "Show me sales by region" renders your `<Chart>`. "Add a task" updates your `<TaskBoard>`.

## Installation

```bash
npm create tambo-app my-tambo-app
cd my-tambo-app
npx tambo init      # choose cloud or self-hosted
npm run dev
```

Or add to an existing project:

```bash
npm install @tambo-ai/react
npx tambo init
```

## Quick Start

```tsx
import { TamboProvider, useTambo, useTamboThreadInput } from "@tambo-ai/react";
import { z } from "zod/v4";

// 1. Register components with Zod schemas
const components = [
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

// 2. Wrap your app
function App() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      userKey={currentUserId} // Required: identifies thread owner
      components={components}
    >
      <ChatInterface />
    </TamboProvider>
  );
}

// 3. Use hooks
function ChatInterface() {
  const { messages, isStreaming } = useTambo();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await submit();
      }}
    >
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isStreaming && <LoadingIndicator />}
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button disabled={isPending}>Send</button>
    </form>
  );
}
```

## Key Hooks

| Hook                                                                                               | Description                                                 |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`useTambo()`](https://docs.tambo.co/reference/react-sdk/hooks#usetambo)                           | Primary hook - messages, streaming state, thread management |
| [`useTamboThreadInput()`](https://docs.tambo.co/reference/react-sdk/hooks#usetambothreadinput)     | Handle user input, image uploads, and message submission    |
| [`useTamboThread()`](https://docs.tambo.co/concepts/conversation-storage)                          | Fetch a single thread by ID (React Query)                   |
| [`useTamboThreadList()`](https://docs.tambo.co/concepts/conversation-storage)                      | Fetch thread list with filtering and pagination             |
| [`useTamboStreamStatus()`](https://docs.tambo.co/reference/react-sdk/hooks#usetambostreamstatus)   | Monitor prop-level streaming status for progressive loading |
| [`useTamboSuggestions()`](https://docs.tambo.co/concepts/suggestions)                              | Generate contextual suggestions                             |
| [`useTamboComponentState()`](https://docs.tambo.co/concepts/generative-interfaces/component-state) | Bidirectional component state synced with the backend       |
| [`useTamboVoice()`](https://docs.tambo.co/reference/react-sdk/hooks#usetambovoice)                 | Voice input and transcription                               |

## Features

- **[Generative Components](https://docs.tambo.co/concepts/generative-interfaces/generative-components)** - AI renders the right component based on conversation
- **[Interactable Components](https://docs.tambo.co/concepts/generative-interfaces/interactable-components)** - Persistent stateful components that update as users refine requests
- **[MCP Integration](https://docs.tambo.co/concepts/model-context-protocol)** - Connect to Linear, Slack, databases, or your own MCP servers
- **[Local Tools](https://docs.tambo.co/guides/take-actions/register-tools)** - Define browser-side functions the AI can call
- **[Streaming](https://docs.tambo.co/reference/react-sdk/hooks#usetambostreamstatus)** - Props stream to components as the LLM generates them

## MCP Dependency Note

`@modelcontextprotocol/sdk` is included automatically when you install `@tambo-ai/react`.

If you import from `@tambo-ai/react/mcp` **and** use features that require schema validation (like component prop schemas via `propsSchema`, or tool schemas via `inputSchema`/`outputSchema`), install the optional peer dependencies:

Zod 3 (`^3.25.76`) and Zod 4 (`^4`) are both supported. We recommend Zod 4 for new projects. `zod-to-json-schema@^3.25.1` is tested and known to support both.

Install **exactly one** of the following (do not install both Zod 3 and Zod 4):

```bash
# Recommended (Zod 4)
npm install zod@^4 zod-to-json-schema@^3.25.1

# Or, for existing projects using Zod 3
npm install zod@^3.25.76 zod-to-json-schema@^3.25.1
```

## Learn More

- **[GitHub](https://github.com/tambo-ai/tambo)** - Full documentation, examples, and ⭐ star us!
- **[Docs](https://docs.tambo.co)** - Guides and API reference
- **[UI Library](https://ui.tambo.co)** - Pre-built components
- **[Discord](https://discord.gg/dJNvPEHth6)** - Community and support

## License

MIT - see [LICENSE](https://github.com/tambo-ai/tambo/blob/main/LICENSE)

---

**For AI/LLM agents:** [docs.tambo.co/llms.txt](https://docs.tambo.co/llms.txt)
