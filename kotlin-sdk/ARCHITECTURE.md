# Tambo Kotlin SDK - Project Overview

## Architecture

The Tambo Kotlin SDK follows a modular architecture designed for native Android development with Jetpack Compose.

### Core Modules

#### 1. Network Layer (`TamboClient.kt`)

- HTTP client using Ktor
- WebSocket support for streaming
- Automatic authentication via API key
- User token support for multi-user apps

#### 2. Data Models (`Models.kt`, `StreamEvent.kt`)

- Thread management
- Message types and content
- Streaming events
- Serialization with kotlinx.serialization

#### 3. Component System (`component/`)

- `TamboComponent` - Interface for UI components
- `ComponentRegistry` - Component registration and lookup
- `ComponentSchema` - Type-safe prop validation
- `ComponentSchemaBuilder` - Fluent API for schemas

#### 4. Tool System (`tool/`)

- `TamboTool` - Interface for custom functions
- `ToolRegistry` - Tool registration and lookup
- `ToolSchema` - Parameter validation
- `ToolSchemaBuilder` - Fluent API for parameters

#### 5. Compose Integration (`compose/`)

- `TamboProvider` - Main composition provider
- `useTambo` - Access SDK state
- `useTamboThread` - Thread management
- `useTamboThreadInput` - Input handling

#### 6. Pre-built Components (`compose/components/`)

- `TamboChat` - Complete chat interface
- `MessageBubble` - Individual messages
- `LoadingIndicator` - Loading states
- `ErrorMessage` - Error handling

#### 7. MCP Support (`mcp/`)

- Model Context Protocol integration
- Server configuration
- Tool, prompt, and resource types

## Design Decisions

### 1. Jetpack Compose First

Built specifically for Compose, not View-based Android development. This enables:

- Declarative UI
- State management
- Reactive updates
- Modern Android development patterns

### 2. Coroutines and Flow

Asynchronous operations use Kotlin coroutines and Flow:

- Structured concurrency
- Cancellation support
- Backpressure handling
- Natural Kotlin patterns

### 3. Type Safety

Heavily leverages Kotlin's type system:

- Sealed classes for events
- Data classes for models
- Null safety
- DSL builders for schemas

### 4. Composition over Inheritance

Uses composition patterns:

- Component registry vs. component hierarchy
- Tool registry vs. tool inheritance
- Provider pattern for dependency injection

### 5. Streaming by Default

WebSocket streaming for real-time updates:

- Progressive rendering
- Lower latency
- Better UX for long responses

## Package Structure

```
co.tambo.sdk/
├── Models.kt                 - Core data models
├── TamboClient.kt           - HTTP/WebSocket client
├── StreamEvent.kt           - Streaming events
├── component/
│   ├── TamboComponent.kt    - Component interface
│   └── ComponentRegistry.kt - Registry
├── tool/
│   ├── TamboTool.kt        - Tool interface
│   └── ToolRegistry.kt     - Registry
├── compose/
│   ├── TamboProvider.kt    - Main provider
│   ├── UseTamboThread.kt   - Thread hook
│   ├── UseTamboThreadInput.kt - Input hook
│   └── components/
│       ├── TamboChat.kt    - Chat UI
│       ├── MessageBubble.kt - Message UI
│       └── LoadingAndError.kt - Utility components
└── mcp/
    └── MCPModels.kt         - MCP types
```

## Data Flow

1. User types message in `TamboChat`
2. `useTamboThreadInput` manages input state
3. `submit()` sends message via `TamboClient`
4. WebSocket streams events back
5. `ThreadState` updates with new messages
6. Compose recomposes UI automatically

## Component Lifecycle

1. Component defined by extending `TamboComponentBase`
2. Schema defined in `init` block
3. Registered with `ComponentRegistry` via `TamboProvider`
4. AI selects component based on context
5. Props validated against schema
6. `Render()` called with validated props
7. Compose renders the component

## Tool Execution Flow

1. Tool defined by extending `TamboToolBase`
2. Parameter schema defined in `init` block
3. Registered with `ToolRegistry` via `TamboProvider`
4. AI determines when to call tool
5. Parameters validated against schema
6. `execute()` called with validated params
7. Result returned to AI as JSON

## Threading Model

- Main thread: UI rendering (Compose)
- IO thread: Network requests (Ktor)
- Default dispatcher: CPU-bound work
- Structured concurrency via coroutines

## Error Handling

- `Result<T>` for synchronous operations
- Try/catch in suspend functions
- Flow error handling for streams
- User-visible error messages in UI

## State Management

- Composition local for DI
- State hoisting pattern
- Single source of truth
- Unidirectional data flow

## Performance Considerations

- Lazy loading of threads
- Streaming reduces initial latency
- Compose recomposition optimization
- Connection pooling in Ktor
- Structured concurrency for cancellation

## Testing Strategy

- Unit tests for data models
- Unit tests for registries
- Integration tests for client
- Compose UI tests for components
- Mock server for end-to-end tests

## Future Enhancements

### Planned Features

- Offline support with local caching
- Voice input integration
- Image and file upload
- Custom LLM provider support
- Advanced streaming controls
- Background sync
- Push notifications
- Analytics integration

### Potential Improvements

- Code generation for component schemas
- Annotation processor for registration
- Kotlin multiplatform support
- Desktop support via Compose Desktop
- iOS support via Kotlin Multiplatform

## Dependencies

### Core

- Kotlin 2.0.21
- Kotlinx Coroutines 1.9.0
- Kotlinx Serialization 1.7.3

### Network

- Ktor Client 3.0.3
- Ktor WebSockets 3.0.3

### Android

- Jetpack Compose Runtime 1.7.6
- Material3 (peer dependency)

### Testing

- JUnit 4.13.2
- MockK 1.13.15
- Kotlinx Coroutines Test 1.9.0

## Comparison with React SDK

| Feature          | Kotlin SDK      | React SDK             |
| ---------------- | --------------- | --------------------- |
| Language         | Kotlin          | TypeScript/JavaScript |
| UI Framework     | Jetpack Compose | React                 |
| Platform         | Android         | Web/React Native      |
| State Management | Compose State   | React State/Context   |
| Async            | Coroutines/Flow | Promises/Async/Await  |
| Type Safety      | Strong (Kotlin) | Strong (TypeScript)   |
| Streaming        | Flow-based      | Event-based           |
| Component Model  | Composable      | React Components      |

## Contributing

See CONTRIBUTING.md for development guidelines.

## License

MIT License - See LICENSE file
