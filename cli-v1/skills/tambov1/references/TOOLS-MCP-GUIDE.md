# Tools & MCP Integration Guide

Extend AI capabilities with local tools and Model Context Protocol (MCP) servers.

## Local Tools

Give AI the ability to call functions and get results back.

### Creating a Local Tool

```tsx
import { z } from "zod"
import { useTamboTools } from "@tambo-ai/react"

// Define tool schema
const searchToolSchema = z.object({
  query: z.string().describe("Search query"),
  limit: z.number().default(10).describe("Max results to return"),
})

// Create tool definition
const searchTool = {
  name: "search",
  description: "Search the knowledge base for relevant information",
  schema: searchToolSchema,
  handler: async ({ query, limit }) => {
    // Your implementation
    const results = await searchKnowledgeBase(query, limit)
    return { results }
  },
}
```

### Registering Tools

In your tambo.ts config:

```tsx
import { searchTool, calculateTool } from "./tools"

export const tamboConfig = {
  // ... component registry
  tools: [searchTool, calculateTool],
}
```

Or dynamically with hook:

```tsx
function MyComponent() {
  const { registerTool } = useTamboTools()

  useEffect(() => {
    registerTool({
      name: "getCurrentUser",
      description: "Get info about the currently logged-in user",
      schema: z.object({}),
      handler: async () => {
        return { user: currentUser }
      },
    })
  }, [])
}
```

### Tool Best Practices

1. **Clear descriptions** - AI uses these to decide when to call
2. **Typed schemas** - Use Zod with `.describe()` on all fields
3. **Error handling** - Return structured errors, not thrown exceptions
4. **Idempotent where possible** - Same input = same result
5. **Fast execution** - Tools block the response stream

## MCP Integration

Connect to external MCP servers for additional capabilities.

### Adding MCP Server

```tsx
export const tamboConfig = {
  mcp: {
    servers: [
      {
        name: "github",
        transport: {
          type: "stdio",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
      },
    ],
  },
}
```

### MCP Server Types

| Transport | Use Case |
|-----------|----------|
| `stdio` | Local process communication |
| `sse` | Server-sent events over HTTP |
| `websocket` | Real-time bidirectional |

### Local Resources

Provide context to AI without a full MCP server:

```tsx
const tamboConfig = {
  resources: [
    {
      uri: "file:///docs/api-reference",
      name: "API Documentation",
      mimeType: "text/markdown",
      content: () => fetchApiDocs(),
    },
  ],
}
```

## Elicitations

Handle AI requests for user input:

```tsx
import { useTamboElicitation } from "@tambo-ai/react"

function ChatInterface() {
  const { elicitation, respond } = useTamboElicitation()

  if (elicitation) {
    return (
      <ElicitationUI
        prompt={elicitation.prompt}
        schema={elicitation.schema}
        onSubmit={(data) => respond(data)}
      />
    )
  }

  return <NormalChat />
}
```

## Tool vs Component Decision

| Use Tool When | Use Component When |
|---------------|-------------------|
| Fetching data | Displaying data |
| Performing actions | Interactive UI |
| Need return value | Visual feedback |
| Background operation | User sees result |

Example flow:
1. AI calls `searchTool` → gets results
2. AI renders `SearchResults` component → user sees results

## Common Patterns

### Tool + Component Combo

```tsx
// Tool fetches data
const weatherTool = {
  name: "getWeather",
  description: "Get current weather for a location",
  schema: z.object({
    location: z.string().describe("City name"),
  }),
  handler: async ({ location }) => {
    const weather = await fetchWeather(location)
    return weather
  },
}

// Component displays it
export function WeatherCard({ location, temp, condition }: WeatherCardProps) {
  return (
    <div className="max-w-sm p-4 rounded-lg border">
      <h3 className="font-semibold">{location}</h3>
      <p className="text-3xl">{temp}°</p>
      <p className="text-muted-foreground">{condition}</p>
    </div>
  )
}
```

AI can: call `getWeather("Seattle")` → render `WeatherCard` with results

### Action Tool with Confirmation

```tsx
const deleteItemTool = {
  name: "deleteItem",
  description: "Delete an item. ALWAYS ask user for confirmation first.",
  schema: z.object({
    itemId: z.string().describe("ID of item to delete"),
    confirmed: z.boolean().describe("User confirmed deletion"),
  }),
  handler: async ({ itemId, confirmed }) => {
    if (!confirmed) {
      return { error: "User must confirm deletion" }
    }
    await deleteItem(itemId)
    return { success: true, deleted: itemId }
  },
}
```
