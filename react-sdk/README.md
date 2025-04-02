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

## Installation

```bash
npm install @tambo-ai/react
```

## Quick Start

Use our template:

```bash
git clone https://github.com/tambo-ai/tambo-template.git && cd tambo-template && npm install && npx tambo init

npm run dev
```

or try adding it to your existing project:

```bash
npx tambo full-send
```

## Basic Usage

1. Add tambo ai to your React app with a simple provider pattern:

```jsx
import { TamboProvider } from "@tambo-ai/react";

function App() {
  return (
    <TamboProvider apiKey="your-api-key">
      <YourApp />
    </TamboProvider>
  );
}
```

2. Displaying a message thread:

```jsx
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";

function ChatInterface() {
  const { thread, sendThreadMessage } = useTambo();
  const { value, setValue, submit } = useTamboThreadInput();

  return (
    <div>
      {/* Display messages */}
      <div>
        {thread.messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div>{message.content}</div>
            {message.component && message.component.renderedComponent}
          </div>
        ))}
      </div>

      {/* Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="input-form"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Core Features

- **Specialized hooks for specific needs:**

  - `useTambo` - Primary entrypoint for the Tambo React SDK
  - `useTamboThreadInput` - Input state and submission
  - `useTamboSuggestions` - AI-powered message suggestions
  - `useTamboThreadList` - Conversation management
  - `useTamboComponentState` - AI-generated component state
  - `useTamboThread` - Access to current thread context

- **Component registration for AI-generated UI**
- **Tool integration for your data sources**
- **Streaming responses for real-time interactions**

## Component Registration

Define which components your AI assistant can use to respond to users by passing them to the TamboProvider:

```jsx
import { TamboProvider } from "@tambo-ai/react";
import { WeatherCard } from "./components/WeatherCard";
import { z } from "zod";

// Define your components
const components = [
  {
    name: "WeatherCard",
    description: "A component that displays weather information",
    component: WeatherCard,
    propsSchema: z.object({
      temperature: z.number(),
      condition: z.string(),
      location: z.string(),
    }),
  },
];

// Pass them to the provider
function App() {
  return (
    <TamboProvider apiKey="your-api-key" components={components}>
      <YourApp />
    </TamboProvider>
  );
}
```

You can also use `z.describe()` for extra prompting to the AI:

```tsx
import { z } from "zod";

schema = z.object({
  data: z.object({
    labels: z.array(z.string()).describe("Use single words or short phrases."),
    values: z.array(z.number()).describe("Use whole numbers."),
  }),
  type: z
    .enum(["bar", "line", "pie"])
    .describe(
      "Use a chart type that is appropriate for the data. Only use pie charts when less than 5 values.",
    ),
});
```

## Tool Integration

Connect your data sources without writing complex integration code:

```jsx
import { TamboProvider } from "@tambo-ai/react";
import { WeatherCard } from "./components/WeatherCard";
import { z } from "zod";

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

// Define your components with associated tools
const components = [
  {
    name: "WeatherCard",
    description: "A component that displays weather information",
    component: WeatherCard,
    propsSchema: z.object({
      temperature: z.number(),
      condition: z.string(),
      location: z.string(),
    }),
    associatedTools: [dataTool], // Associate the tool with the component
  },
];

// Pass them to the provider
function App() {
  return (
    <TamboProvider apiKey="your-api-key" components={components}>
      <YourApp />
    </TamboProvider>
  );
}
```

## Resources

- [Full Documentation](https://tambo.co/docs)
- [Showcase Documentation](../showcase/README.md)

## License

MIT License - see the [LICENSE](../LICENSE) file for details.

## Join the Community

We're building tools for the future of user interfaces. Your contributions matter.

**[Star this repo](https://github.com/tambo-ai/tambo)** to support our work.

**[Join our Discord](https://discord.gg/dJNvPEHth6)** to connect with other developers.
