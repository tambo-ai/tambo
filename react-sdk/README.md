# tambo ai

Build AI assistants and agents in React with a few lines of code.

<p align="center">
  <img src="../assets/tambo-animation.gif" alt="tambo ai Octo Juggling">
</p>

## What is tambo ai?

tambo ai is a React library that deals with the boring parts. Get started with an AI assistant in minutes.

We handle:

- Thread management
- State persistence
- Streaming responses
- AI Orchestration
- A Compatible React UI Library

You get clean React hooks that integrate seamlessly with your codebase.

[![npm version](https://img.shields.io/npm/v/@tambo-ai/react.svg)](https://www.npmjs.com/package/@tambo-ai/react)
[![License](https://img.shields.io/github/license/tambo-ai/tambo.svg)](https://github.com/tambo-ai/tambo/blob/main/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/tambo-ai/tambo.svg)](https://github.com/tambo-ai/tambo/commits/main)
[![Discord](https://img.shields.io/badge/chat-on%20discord-blue.svg)](https://discord.gg/dJNvPEHth6)

### Get Started in Minutes

One command to set up everything:

```bash
npx tambo --full-send
```

Then wrap your app with the provider:

```tsx
import { TamboProvider } from "@tambo-ai/react";

<TamboProvider apiKey="your-api-key" model="claude-3-5-sonnet-20240620">
  <App />
</TamboProvider>;
```

Add the message thread component to your app:

```tsx
import MessageThread from "ui/components/MessageThread";

function App() {
  return (
    <div>
      {/* Your existing UI */}
      <MessageThread />
    </div>
  );
}
```

That's it! Your app now has an AI copilot that generates UI components on demand.

Support our development by starring the repository: [Star on GitHub](https://github.com/tambo-ai/tambo)

## Installation

```bash
npm install @tambo-ai/react
```

## Core Concepts

### 1. Component Registration

Define which components your AI assistant can use to respond to users:

```tsx
registerComponent({
  component: DataChart,
  name: "DataChart",
  description: "Displays data as a chart",
  propsDefinition: {
    data: "{ labels: string[]; values: number[] }",
    type: "'bar' | 'line' | 'pie'",
  },
});
```

### 2. Tool Integration

Connect your data sources without writing complex integration code:

```tsx
// Define a tool with Zod schema
const dataTool = {
  name: "fetchData",
  description: "Fetch data for visualization",
  tool: async ({ dataType }) => {
    /* fetch data */
  },
  toolSchema: z
    .function()
    .args(z.object({ dataType: z.string() }))
    .returns(z.any()),
};

// Associate tool with component
registerComponent({
  // ...component details
  associatedTools: [dataTool],
});
```

### 3. Thread Management

Let your AI agent maintain conversation context automatically:

```tsx
// Send a message in a specific thread
sendThreadMessage("Show me sales data", {
  contextKey: userId,
  streamResponse: true,
});

// Switch between threads
switchCurrentThread(threadId);
```

## API Reference

### Main Hooks

- `useTambo`: All-in-one hook for most functionality
- `useTamboRegistry`: Component registration
- `useTamboThread`: Thread management
- `useTamboSuggestions`: AI-powered message suggestions

## Docs

For complete documentation, check out the [docs](https://tambo.co/docs).

## License

MIT License - see the [LICENSE](https://github.com/tambo-ai/tambo/blob/main/LICENSE) file for details.

## Join the Community

We're building tools for the future of user interfaces. Your contributions matter.

**[Star this repo](https://github.com/tambo-ai/tambo)** to support our work.

**[Join our Discord](https://discord.gg/dJNvPEHth6)** to connect with other developers.

---

<p align="center">
  <i>Built by developers, for developers.</i><br>
  <i>Because we believe the future of UI is generative and hyper-personalized.</i>
</p>
