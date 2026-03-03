# @tambo-ai/client

Framework-agnostic client for [Tambo AI](https://tambo.co). Provides streaming, tool execution, and thread management without React dependencies.

## Installation

```sh
npm install @tambo-ai/client
```

## Quick Start

```ts
import { TamboClient } from "@tambo-ai/client";

const client = new TamboClient({ apiKey: "your-api-key" });

// Send a message and await the final thread state
const stream = client.run("Hello!");
const thread = await stream.thread;
console.log(thread.messages);
```

## Usage

### Streaming with async iteration

```ts
const stream = client.run("What is 2 + 2?");

for await (const { event, snapshot } of stream) {
  console.log(event.type, snapshot.messages.length);
}
```

### Thread management

```ts
// Start a new thread
const threadId = client.startNewThread();

// Switch to an existing thread
await client.switchThread("thread_abc123");

// List all threads
const threads = await client.listThreads();
```

### Tool registration

```ts
client.registerTool({
  name: "get_weather",
  description: "Get the current weather for a location",
  tool: async ({ location }) => {
    return { temp: 72, condition: "sunny" };
  },
  inputSchema: {
    type: "object",
    properties: {
      location: { type: "string" },
    },
    required: ["location"],
  },
});
```

### React integration

For React applications, use `@tambo-ai/react` which wraps this package with hooks and providers:

```sh
npm install @tambo-ai/react
```

See [@tambo-ai/react](https://tambo.co/docs) for React-specific documentation.

## API

### `TamboClient`

The main client class. Implements `getState()` and `subscribe()` for use with `useSyncExternalStore` or similar framework bindings.

### `TamboStream`

Returned by `client.run()`. Two consumption modes:

- **Async iteration**: `for await (const { event, snapshot } of stream) { ... }`
- **Promise**: `const thread = await stream.thread`

### Key types

- `TamboThread` - Thread state with messages, status, and metadata
- `StreamEvent` - Event/snapshot pair yielded during streaming
- `TamboClientOptions` - Configuration for client creation
- `ClientState` - Full client state (thread map, current thread, streaming state)

## License

MIT
