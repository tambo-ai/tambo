# Tools and Context

Gives Tambo access to data and capabilities through tools, MCP servers, and context.

## Contents

- [Quick Start](#quick-start)
- [Custom Tools](#custom-tools) — defineTool(), inputSchema, outputSchema
- [MCP Servers](#mcp-servers) — server-side and client-side setup
- [Context Helpers](#context-helpers) — dynamic per-message context, runtime registration
- [Context Attachments](#context-attachments) — one-time context for next message
- [Local Resources](#local-resources) — static, dynamic, and programmatic @ mentionable resources

## Quick Start

```tsx
// Custom tool Tambo can call
const fetchUserTool = defineTool({
  name: "fetchUser",
  description: "Fetch user by ID",
  inputSchema: z.object({ userId: z.string() }),
  tool: async ({ userId }) => fetchUser(userId),
});

<TamboProvider tools={[fetchUserTool]}>
  <App />
</TamboProvider>;
```

## Custom Tools

Register JavaScript functions Tambo can call:

```tsx
import { defineTool, TamboProvider } from "@tambo-ai/react";
import { z } from "zod";

const fetchUserTool = defineTool({
  name: "fetchUser",
  description: "Fetch a user by ID",
  inputSchema: z.object({
    userId: z.string().describe("The user ID to fetch"),
  }),
  outputSchema: z.object({
    name: z.string(),
    email: z.string(),
  }),
  tool: async ({ userId }) => {
    const user = await fetchUser(userId);
    return user;
  },
});

<TamboProvider tools={[fetchUserTool]} components={components}>
  <App />
</TamboProvider>;
```

### Tool Key Points

- **inputSchema**: Zod object for parameters, use `.describe()` on fields
- **outputSchema**: Zod schema for return value. Required when using `registerTool()`, optional with `defineTool()`.
- **tool**: Function receives single object with input params
- **transformToContent**: Enable rich content responses (images, formatted text)
- **Null handling**: The AI often sends null for optional fields. Strip nulls before passing to APIs that reject them:
  ```tsx
  const cleaned = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v != null),
  );
  ```

### Dynamic Tool Registration (for apps with existing API clients)

When integrating with an existing app that has its own API client (tRPC, GraphQL, REST), use `registerTool()` inside a React component instead of `defineTool()` at module level. This lets you access the app's client via hooks.

```tsx
import { useTambo } from "@tambo-ai/react";
import { trpc } from "./trpc";

function MyChat() {
  const { registerTool } = useTambo();
  const utils = trpc.useUtils();
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    registerTools(registerTool, utils.client, utils);
  }, [registerTool, utils.client, utils]);

  return <MessageThreadPanel />;
}
```

The `useRef` guard prevents infinite re-renders since `registerTool` updates state.

### Cache Invalidation After Mutations

When a tool modifies data, invalidate the relevant query cache so the host app's UI updates immediately:

```tsx
tool: async (input) => {
  const result = await client.project.create.mutate(input);
  await utils.project.list.invalidate(); // UI refreshes
  return result;
},
```

## MCP Servers

Connect to external MCP servers for tools, resources, prompts:

| Feature       | Server-side      | Client-side              |
| ------------- | ---------------- | ------------------------ |
| Performance   | Fast (direct)    | Slower (browser proxies) |
| Auth          | OAuth + API keys | Browser session only     |
| Local servers | No               | Yes (localhost)          |
| Config        | Tambo dashboard  | React code               |

### Server-Side Setup

1. Go to [project dashboard](https://console.tambo.co)
2. Click "Add MCP Server"
3. Enter URL and server type (StreamableHTTP or SSE)
4. Complete OAuth if required

### Client-Side Setup

```bash
npm install @modelcontextprotocol/sdk@^1.24.0 zod@^4.0.0 zod-to-json-schema@^3.25.0
```

```tsx
import { TamboProvider } from "@tambo-ai/react";
import { MCPTransport } from "@tambo-ai/react/mcp";

<TamboProvider
  mcpServers={[
    {
      url: "http://localhost:8123/",
      serverKey: "local",
      transport: MCPTransport.HTTP,
    },
  ]}
>
  <App />
</TamboProvider>;
```

## Context Helpers

Provide dynamic context on every message:

```tsx
<TamboProvider
  contextHelpers={{
    currentPage: () => ({ url: window.location.href }),
    currentTime: () => ({ time: new Date().toISOString() }),
    selectedItems: () => selectedItems.map((i) => i.name),
  }}
>
  <App />
</TamboProvider>
```

### Dynamic Context Helpers

Add/remove helpers at runtime:

```tsx
const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

useEffect(() => {
  addContextHelper("project", () => ({ projectId, projectName }));
  return () => removeContextHelper("project");
}, [projectId, projectName, addContextHelper, removeContextHelper]);
```

## Context Attachments

One-time context for the next message (cleared after sending):

```tsx
const { addContextAttachment, attachments, removeContextAttachment } =
  useTamboContextAttachment();

function handleSelectFile(file) {
  addContextAttachment({
    context: file.content,
    displayName: file.name,
    type: "file",
  });
}
```

## Local Resources

Register @ mentionable resources users can reference in messages:

### Static Resources

```tsx
import { TamboProvider, ListResourceItem } from "@tambo-ai/react";

const resources: ListResourceItem[] = [
  { uri: "docs://api", name: "API Reference", mimeType: "text/plain" },
  { uri: "docs://faq", name: "FAQ", mimeType: "text/plain" },
];

const getResource = async (uri: string) => {
  const content = await fetchDoc(uri);
  return { contents: [{ uri, mimeType: "text/plain", text: content }] };
};

<TamboProvider resources={resources} getResource={getResource}>
  <App />
</TamboProvider>;
```

### Dynamic Resources

```tsx
const listResources = async (search?: string) => {
  const docs = await fetchDocs();
  return docs
    .filter((d) => !search || d.name.includes(search))
    .map((d) => ({
      uri: `docs://${d.id}`,
      name: d.title,
      mimeType: "text/plain",
    }));
};

const getResource = async (uri: string) => {
  const doc = await fetchDocument(uri);
  return { contents: [{ uri, mimeType: "text/plain", text: doc.content }] };
};

// Both listResources and getResource must be provided together
<TamboProvider listResources={listResources} getResource={getResource}>
  <App />
</TamboProvider>;
```

### Programmatic Registration

```tsx
const { registerResource, registerResources } = useTamboRegistry();

// Single resource
registerResource({
  uri: "user://file.txt",
  name: "File",
  mimeType: "text/plain",
});

// Batch registration
registerResources(
  docs.map((d) => ({
    uri: `docs://${d.id}`,
    name: d.title,
    mimeType: "text/plain",
  })),
);
```

### Context Types Summary

| Type                | When Called       | Use Case                           |
| ------------------- | ----------------- | ---------------------------------- |
| Context Helpers     | Every message     | Ambient state (current page, time) |
| Context Attachments | Next message only | User-selected files, selections    |
| Resources           | When @ mentioned  | Documentation, searchable data     |
