# tambo-ai

Tambo allows AI models to dynamically render React components in response to user messages, enabling AI assistants to display interactive widgets, charts, forms, and other UI elements instead of just text. Tambo is a great way to add generative UI to your AI assistant, copilot, or agent.

This package provides react hooks to talk to the Tambo API and render custom components inline, but does not provide any UI components on its own. For pre-built UI components that use this package, see [tambo-ui](https://ui.tambo.co).

## Build with MCP and Generative UI

[![Watch the video](https://img.youtube.com/vi/6zDDPfr7Aoo/0.jpg)](https://youtu.be/6zDDPfr7Aoo)

[Source code](https://github.com/tambo-ai/mcp-template)

### Creating a new project

You can create a new project using our MCP template:

```bash
npx tambo create-app -t mcp tambo-mcp-app
```

This will create a new nextjs project with Tambo pre-configured, and then step you through the process of setting up a Tambo project, including signing up for an API key, and adding it to `.env.local`.

### Adding components to an existing project

If you have an existing project, you can add components to it. First, initialize your project:

```bash
npx tambo init
```

This will step you through the process of setting up a Tambo project, including signing up for an API key, and adding it to `.env.local`.

Then add components from our library to your project in the `components/ui` directory:

```bash
npx tambo add message-thread-full
```

See the complete component library at [ui.tambo.co](https://ui.tambo.co).

### Manual installation

You can also install Tambo manually:

```bash
npm install @tambo-ai/react
# or
yarn add @tambo-ai/react
```

## How does Tambo work?

Tambo uses a client-side registry of React components that can be used by an LLM.

### 1. Register your components

```tsx
import { type TamboComponent } from "@tambo-ai/react";
import { Graph, graphSchema } from "@/components/ui/graph";

const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema, // zod schema
  },
  // Add more components
];
```

### 2. Wrap your app in a TamboProvider

If you are using one of Tambo's pre-built components, you can wrap your app in a TamboProvider.

```tsx
import { TamboProvider } from "@tambo-ai/react";
import { MessageThreadFull } from "@/components/ui/message-thread-full";

// In your chat page
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  components={components}
>
  <MessageThreadFull />
</TamboProvider>;
```

You can also use your own components with the TamboProvider:

```tsx
import { TamboProvider } from "@tambo-ai/react";

<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  components={components}
>
  <YourChatComponents />
</TamboProvider>;
```

### 3. Render AI-generated components

This is also handled automatically for you if you are using the `MessageThreadFull` component.

For custom components, you can use the `useMessageContext` hook to get the current message.

```tsx
import {
  useTambo,
  useMessageContext,
  type TamboThreadMessage,
} from "@tambo-ai/react";

function ChatHistory() {
  const { thread } = useTambo();
  return (
    <div>
      {thread.messages.map((message) => (
        <CustomMessage key={message.id} message={message} />
      ))}
    </div>
  );
}

function CustomMessage({ message }: { message: TamboThreadMessage }) {
  // Render the component
  return (
    <div>
      {/* Render the message content */}
      <div>Role: {message.role}</div>
      <div>
        {message.content.map((part) =>
          part.type === "text" ? (
            <div key={part.id}>{part.text}</div>
          ) : (
            <div key={part.id}>Non-text content: {part.type}</div>
          ),
        )}
      </div>
      {/* Render the component, if any */}
      <div>{message.renderedComponent}</div>
    </div>
  );
}
```

### 4. Submit user messages

If you are using the `MessageThreadFull` component, you can skip this step, it is handled automatically.

If you are using a custom component, you can use the `useTamboThreadInput` hook to submit user messages.

```tsx
import { useTamboThreadInput } from "@tambo-ai/react";

function ChatInput() {
  const { submit, value, setValue } = useTamboThreadInput();

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={() => submit()}>Send</button>
    </div>
  );
}
```

### 5. Put it all together

```tsx
function ChatInterface() {
  return (
    <div>
      <ChatHistory />
      <ChatInput />
    </div>
  );
}
```

## Getting Started

### Templates

| App                                                                    | Description                            |
| ---------------------------------------------------------------------- | -------------------------------------- |
| [MCP](https://github.com/tambo-ai/mcp-template) (new!)                 | Get started with MCP + Generative UX   |
| [Regular Tools](https://github.com/tambo-ai/tambo-template)            | Get started with Generative UX         |
| [Conversational Form](https://github.com/tambo-ai/conversational-form) | Collect information with generative UX |

Check out our UI library [tambo-ui](https://ui.tambo.co) for components that leverage tambo.

### In depth examples

#### 1. Displaying a message thread:

```tsx
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";

function ChatInterface() {
  const { thread } = useTambo();
  const { value, setValue, submit } = useTamboThreadInput();

  return (
    <div>
      {/* Display messages */}
      <div>
        {thread.messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div>{message.content}</div>
            {message.renderedComponent}
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

#### 2. Adding AI-Generated Components:

Create components that can be dynamically generated by the AI:

```tsx
// components/WeatherCard.jsx
import { useTamboComponentState } from "@tambo-ai/react";

export function WeatherCard({
  location,
  temperature,
  condition,
}: {
  location: string;
  temperature: number;
  condition: string;
}) {
  // useTamboComponentState manages state that persists even if
  // the component is unmounted
  const [isMetric, setIsMetric] = useTamboComponentState(
    "isMetric", // unique identifier for this component's state
    false, // default value
  );

  return (
    <div>
      <h3>{location}</h3>
      <div>
        {isMetric ? temperature : (temperature * 1.8 + 32).toFixed(1)}°
        {isMetric ? "C" : "F"}
      </div>
      <div>{condition}</div>
      <input
        type="checkbox"
        checked={isMetric}
        onChange={(e) => setIsMetric(e.target.checked)}
      />
    </div>
  );
}
```

#### 3. Register your components:

```tsx
// App.jsx
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

### Adding Tools for the AI

Register tools to make them available to the AI:

```tsx
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

// Define your tools
const tools: TamboTool[] = [
  {
    name: "getWeather",
    description: "Fetches current weather data for a given location",
    tool: async (location: string, units: string = "celsius") => {
      // Example implementation
      const weather = await fetchWeatherData(location);
      return {
        temperature: weather.temp,
        condition: weather.condition,
        location: weather.city,
      };
    },
    toolSchema: z
      .function()
      .args(
        z.string().describe("Location name (city)"),
        z
          .string()
          .optional()
          .describe("Temperature units (celsius/fahrenheit)"),
      )
      .returns(
        z.object({
          temperature: z.number(),
          condition: z.string(),
          location: z.string(),
        }),
      ),
  },
];

// Pass tools to the provider
<TamboProvider apiKey="your-api-key" tools={tools}>
  <YourApp />
</TamboProvider>;
```

### Using MCP Servers

```tsx
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";

const mcpServers = [
  {
    url: "https://mcp-server-1.com",
    transport: "http",
    name: "mcp-server-1",
  },
];

// Pass MCP servers to the provider
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  components={components}
>
  <TamboMcpProvider mcpServers={mcpServers}>{children}</TamboMcpProvider>
</TamboProvider>;
```

[Read our full documentation](https://tambo.co/docs)

## Join the Community

We're building tools for the future of user interfaces. Your contributions matter.

**[Star this repo](https://github.com/tambo-ai/tambo)** to support our work.

**[Join our Discord](https://discord.gg/dJNvPEHth6)** to connect with other developers.

<p align="center">
  <img src="../assets/tambo-animation.gif" alt="tambo ai Octo Juggling">
</p>
