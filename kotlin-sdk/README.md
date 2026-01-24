# Tambo Kotlin SDK

Kotlin SDK for Tambo AI - Build AI-powered Android apps with Jetpack Compose

## Installation

### Gradle

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("co.tambo:tambo-kotlin-sdk:0.1.0")
}
```

### Maven

```xml
<dependency>
    <groupId>co.tambo</groupId>
    <artifactId>tambo-kotlin-sdk</artifactId>
    <version>0.1.0</version>
</dependency>
```

## Quick Start

### 1. Set up TamboProvider

Wrap your app with `TamboProvider`:

```kotlin
@Composable
fun App() {
    val config = TamboConfig(
        apiKey = "your-api-key-here",
        baseUrl = "https://api.tambo.co"
    )

    TamboProvider(
        config = config,
        components = listOf(),
        tools = listOf()
    ) {
        ChatScreen()
    }
}
```

### 2. Create a Chat Interface

Use the pre-built `TamboChat` component:

```kotlin
@Composable
fun ChatScreen() {
    val threadState = useTamboThread()

    Scaffold(
        topBar = { TopAppBar(title = { Text("AI Chat") }) }
    ) { padding ->
        TamboChat(
            threadState = threadState,
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        )
    }
}
```

### 3. Handle Messages Manually

For custom UI, use hooks directly:

```kotlin
@Composable
fun CustomChat() {
    val threadState = useTamboThread()
    val inputState = useTamboThreadInput(threadState)
    val scope = rememberCoroutineScope()

    Column {
        LazyColumn(modifier = Modifier.weight(1f)) {
            threadState.thread?.messages?.forEach { message ->
                item {
                    MessageBubble(message = message)
                }
            }
        }

        Row {
            TextField(
                value = inputState.value,
                onValueChange = { inputState.setValue(it) },
                modifier = Modifier.weight(1f)
            )

            Button(
                onClick = {
                    scope.launch {
                        inputState.submit()
                    }
                },
                enabled = !inputState.isPending
            ) {
                Text("Send")
            }
        }
    }
}
```

## Registering Components

Create custom components that the AI can render:

```kotlin
class WeatherCard : TamboComponentBase(
    name = "WeatherCard",
    description = "Displays weather information"
) {
    init {
        schema {
            string("location", "Location name", required = true)
            number("temperature", "Temperature in Celsius", required = true)
            string("condition", "Weather condition", required = true)
        }
    }

    @Composable
    override fun Render(props: Map<String, JsonElement>) {
        val location = props["location"]?.jsonPrimitive?.content ?: ""
        val temperature = props["temperature"]?.jsonPrimitive?.int ?: 0
        val condition = props["condition"]?.jsonPrimitive?.content ?: ""

        Card(modifier = Modifier.padding(16.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(location, style = MaterialTheme.typography.headlineSmall)
                Text("$temperature°C", style = MaterialTheme.typography.displayMedium)
                Text(condition, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}
```

Register with TamboProvider:

```kotlin
TamboProvider(
    config = config,
    components = listOf(WeatherCard())
) {
    ChatScreen()
}
```

## Adding Tools

Tools let the AI call functions in your app:

```kotlin
class GetWeatherTool : TamboToolBase(
    name = "getWeather",
    description = "Fetches current weather for a location"
) {
    init {
        schema {
            string("location", "Location name", required = true)
            enum("units", listOf("metric", "imperial"), "Temperature units")
        }
    }

    override suspend fun execute(parameters: Map<String, JsonElement>): Result<JsonElement> {
        val location = parameters["location"]?.jsonPrimitive?.content ?: ""

        return try {
            val weather = buildJsonObject {
                put("temperature", 22)
                put("condition", "Sunny")
                put("location", location)
            }
            Result.success(weather)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

Register with TamboProvider:

```kotlin
TamboProvider(
    config = config,
    tools = listOf(GetWeatherTool())
) {
    ChatScreen()
}
```

## Configuration Options

```kotlin
TamboConfig(
    apiKey = "your-api-key",
    baseUrl = "https://api.tambo.co",
    userToken = "user-specific-token",
    enableDebugLogs = false
)
```

## Hooks

### useTambo()

Access the Tambo client and registries:

```kotlin
val tamboState = useTambo()
val client = tamboState.client
val componentRegistry = tamboState.componentRegistry
val toolRegistry = tamboState.toolRegistry
```

### useTamboThread(threadId?)

Manage thread state and messages:

```kotlin
val threadState = useTamboThread()

val thread = threadState.thread
val isLoading = threadState.isLoading
val error = threadState.error

LaunchedEffect(Unit) {
    threadState.loadThread()
}

scope.launch {
    threadState.sendMessage("Hello, AI!")
}
```

### useTamboThreadInput(threadState)

Handle input state:

```kotlin
val inputState = useTamboThreadInput(threadState)

TextField(
    value = inputState.value,
    onValueChange = { inputState.setValue(it) }
)

Button(
    onClick = { scope.launch { inputState.submit() } },
    enabled = !inputState.isPending
) {
    Text("Send")
}
```

## Pre-built Components

### TamboChat

Complete chat interface with messages and input:

```kotlin
TamboChat(
    threadState = threadState,
    modifier = Modifier.fillMaxSize(),
    placeholder = "Type a message..."
)
```

### MessageBubble

Individual message bubble:

```kotlin
MessageBubble(
    message = message,
    modifier = Modifier.fillMaxWidth()
)
```

### LoadingIndicator

Loading state indicator:

```kotlin
LoadingIndicator(
    message = "Loading messages..."
)
```

### ErrorMessage

Error display with retry:

```kotlin
ErrorMessage(
    message = threadState.error ?: "Unknown error",
    onRetry = { scope.launch { threadState.loadThread() } }
)
```

## Advanced Usage

### Streaming Messages

Messages stream in real-time via WebSocket:

```kotlin
scope.launch {
    tamboState.client.sendMessage(threadId, "Hello").collect { event ->
        when (event) {
            is MessageStreamEvent.Delta -> {
                println("Text delta: ${event.text}")
            }
            is MessageStreamEvent.ComponentStart -> {
                println("Component started: ${event.componentName}")
            }
            is MessageStreamEvent.ComponentProp -> {
                println("Prop update: ${event.propName}")
            }
            is MessageStreamEvent.Complete -> {
                println("Message complete")
            }
            is MessageStreamEvent.Error -> {
                println("Error: ${event.message}")
            }
        }
    }
}
```

### Custom Component Schemas

Complex schema example:

```kotlin
init {
    schema {
        string("title", "Card title", required = true)
        number("value", "Numeric value")
        boolean("enabled", "Whether card is enabled")
        enum("status", listOf("pending", "complete", "error"), "Current status")
        array(
            "items",
            PropertySchema(PropertyType.STRING),
            "List of items"
        )
        obj(
            "metadata",
            mapOf(
                "author" to PropertySchema(PropertyType.STRING),
                "timestamp" to PropertySchema(PropertyType.NUMBER)
            ),
            "Additional metadata"
        )
    }
}
```

## MCP Integration

Connect to Model Context Protocol servers:

```kotlin
val mcpServers = listOf(
    MCPServer(
        name = "filesystem",
        url = "http://localhost:8261/mcp",
        transport = MCPTransport.HTTP
    )
)
```

## API Reference

### TamboConfig

Configuration for Tambo SDK.

Properties:

- `apiKey: String` - Your Tambo API key
- `baseUrl: String` - API base URL
- `userToken: String?` - Optional user-specific token
- `enableDebugLogs: Boolean` - Enable debug logging

### TamboClient

HTTP client for Tambo API.

Methods:

- `suspend fun createThread(metadata: Map<String, String>): Result<Thread>`
- `suspend fun getThread(threadId: String): Result<Thread>`
- `suspend fun sendMessage(threadId: String, content: String, metadata: Map<String, String>): Flow<MessageStreamEvent>`
- `suspend fun deleteThread(threadId: String): Result<Unit>`
- `fun close()`

### TamboComponent

Interface for custom components.

Properties:

- `name: String` - Component name
- `description: String` - Component description
- `propsSchema: ComponentSchema` - Props schema

Methods:

- `@Composable fun Render(props: Map<String, JsonElement>)`

### TamboTool

Interface for custom tools.

Properties:

- `name: String` - Tool name
- `description: String` - Tool description
- `schema: ToolSchema` - Parameter schema

Methods:

- `suspend fun execute(parameters: Map<String, JsonElement>): Result<JsonElement>`

## Examples

See the `examples/` directory for complete examples:

- `basic-chat/` - Simple chat application
- `custom-components/` - Custom component examples
- `custom-tools/` - Tool integration examples

## License

MIT License
