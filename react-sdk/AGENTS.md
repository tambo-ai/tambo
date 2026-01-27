# AGENTS.md

Detailed guidance for Claude Code agents working with the React SDK package.

## Project Overview

This is the **@tambo-ai/react** package - the core React SDK for building AI-powered generative UI applications. It provides hooks, providers, and utilities that enable AI to dynamically generate and manage React components through natural language interaction.

## Essential Commands

```bash
# Development
npm run dev              # Watch mode compilation (CJS + ESM)
npm run build           # Build both CJS and ESM outputs
npm run test            # Run Jest tests
npm run lint            # ESLint code checking
npm run check-types     # TypeScript type checking
npm run clean           # Remove build artifacts
```

## Architecture Overview

### Core Provider System

The SDK uses a nested provider hierarchy (`src/providers/tambo-provider.tsx`):

1. **TamboClientProvider** - API client, authentication, session management
2. **TamboRegistryProvider** - Component and tool registration system
3. **TamboContextHelpersProvider** - Additional context utilities
4. **TamboThreadProvider** - Message thread and conversation management
5. **TamboThreadInputProvider** - User input handling and submission
6. **TamboComponentProvider** - Component lifecycle and state management
7. **TamboInteractableProvider** - Interactive component tracking

### Component Registration Pattern

```typescript
const components: TamboComponent[] = [
  {
    name: "ComponentName",
    description: "Clear description for AI understanding",
    component: ReactComponent,
    propsSchema: zodSchema, // Zod schema for props validation
  },
];
```

### Tool Registration Pattern

Tools can be registered with an optional `transformToContent` function to control how tool responses are converted into content parts:

```typescript
const tools: TamboTool[] = [
  {
    name: "toolName",
    description: "Tool description for AI",
    tool: async (params) => {
      // Tool implementation
      return result;
    },
    inputSchema: z.object({
      // Input parameters schema
    }),
    outputSchema: z.any(), // Output schema
    // Optional: Transform tool response to content parts
    transformToContent: (result) => [
      { type: "text", text: result.text },
      // Can include image_url, input_audio, etc.
    ],
  },
];
```

By default, tool responses are stringified and wrapped in a text content part. The `transformToContent` function allows tools to return rich content including images, audio, or mixed media. This is particularly useful for MCP tools that already return content in the proper format.

### Key Hook System

- **`useTambo()`** - Primary hook accessing all Tambo functionality
- **`useTamboThreadInput()`** - Message submission, input state management
- **`useTamboComponentState()`** - AI-managed component state with streaming
- **`useTamboStreamStatus()`** - Monitor AI response streaming status
- **`useTamboThreadList()`** - Thread management and navigation
- **`useTamboInteractable()`** - Track interactive component registry

## Key Files and Directories

### Source Structure

- `src/hooks/` - React hooks for Tambo functionality
- `src/providers/` - Context providers and state management
- `src/model/` - TypeScript interfaces and data models
- `src/util/` - Utility functions and helpers
- `src/mcp/` - Model Context Protocol integration
- `src/context-helpers/` - Dynamic context generation utilities

### Critical Files

- `src/providers/tambo-provider.tsx` - Main provider implementation
- `src/model/component-metadata.ts` - Component and tool type definitions
- `src/hooks/use-tambo-threads.ts` - Thread management logic
- `src/providers/tambo-prop-stream-provider/` - Streaming prop system

## Development Patterns

### Component State Management

Components can have AI-managed state using `useTamboComponentState`:

```typescript
const [state, setState, { isPending }] = useTamboComponentState(
  "uniqueStateKey",
  initialState,
);
```

### Thread Context Isolation

Each interface should use unique context keys for thread separation:

- Enables multiple independent AI conversations
- Threads persist via API and are retrieved by context key
- Managed through `contextKey` prop on `TamboProvider`

### Streaming Response Handling

The SDK supports real-time streaming of AI responses:

- Text content streams character by character
- Component props stream and update in real-time
- Status monitoring via `useTamboStreamStatus()`

## Build System

### Dual Build Output

- **CommonJS** (`dist/`) - Node.js compatibility, server-side rendering
- **ESM** (`esm/`) - Modern bundlers, tree-shaking support
- **TypeScript declarations** included in both outputs

### Dependencies

- **Peer Dependencies** - React 18/19, React DOM, TypeScript types
- **Core Dependencies** - Tambo TypeScript SDK, React Query, `@modelcontextprotocol/sdk`
- **Optional Peer Dependencies**
  - `zod` (`^3.25` or `^4.0`) and `zod-to-json-schema` (`^3.25.0`) for component schemas and JSON Schema generation when using the `@tambo-ai/react/mcp` subpath

## Testing

### Test Structure

- Tests in `__tests__/` directories alongside source files
- Jest with React Testing Library for component testing
- Mock implementations in `src/testing/` for external dependencies

### Key Test Areas

- Hook functionality and state management
- Provider context passing and updates
- Component registration and lifecycle
- Streaming response handling
- MCP integration

## MCP Integration

Model Context Protocol support enables extending AI capabilities:

- Client-side MCP connections via the `mcpServers` prop on `TamboProvider`
- Tool discovery and execution
- Resource access and management
- Custom protocol implementations

## Development Patterns

### Important Development Rules

- All components must be SSR compatible
- Use strict TypeScript - no `any` types
- Use `z.infer<typeof schema>` for Zod-derived prop types
- Maintain backward compatibility in public APIs
- Follow React hooks rules and best practices

### New End-User Features Process

We have a doc-first approach to developing new features in our React SDK. This means we write the documentation first, then write the code to implement the feature. Our docs are in the docs site directory at ../docs (read [../docs/AGENTS.md](../docs/AGENTS.md)).

1. Read relevant documentation and code in the repository
2. Read the relevant code to ensure you understand the existing code and context
3. Before writing any code, write a detailed description of the feature in the docs site
4. Then write the code to implement the feature
