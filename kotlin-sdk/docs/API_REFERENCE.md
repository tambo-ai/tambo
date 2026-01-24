# API Reference

## Core Classes

### TamboConfig

Configuration object for initializing the Tambo SDK.

```kotlin
data class TamboConfig(
    val apiKey: String,
    val baseUrl: String = "https://api.tambo.co",
    val userToken: String? = null,
    val enableDebugLogs: Boolean = false
)
```

#### Properties

- `apiKey: String` - Your Tambo API key (required)
- `baseUrl: String` - Base URL for Tambo API (default: "https://api.tambo.co")
- `userToken: String?` - Optional user-specific authentication token
- `enableDebugLogs: Boolean` - Enable verbose logging (default: false)

### TamboClient

HTTP client for interacting with Tambo API.

```kotlin
class TamboClient(private val config: TamboConfig)
```

#### Methods

##### createThread

```kotlin
suspend fun createThread(
    metadata: Map<String, String> = emptyMap()
): Result<Thread>
```

Creates a new conversation thread.

##### getThread

```kotlin
suspend fun getThread(threadId: String): Result<Thread>
```

Retrieves an existing thread by ID.

##### sendMessage

```kotlin
suspend fun sendMessage(
    threadId: String,
    content: String,
    metadata: Map<String, String> = emptyMap()
): Flow<MessageStreamEvent>
```

Sends a message and returns a flow of streaming events.

##### deleteThread

```kotlin
suspend fun deleteThread(threadId: String): Result<Unit>
```

Deletes a thread.

##### close

```kotlin
fun close()
```

Closes the HTTP client and releases resources.

## Data Models

### Thread

```kotlin
data class Thread(
    val id: String,
    val messages: List<Message> = emptyList(),
    val metadata: Map<String, JsonElement> = emptyMap(),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

### Message

```kotlin
data class Message(
    val id: String,
    val role: MessageRole,
    val content: MessageContent,
    val timestamp: Long = System.currentTimeMillis(),
    val metadata: Map<String, JsonElement> = emptyMap()
)
```

### MessageRole

```kotlin
enum class MessageRole {
    USER,
    ASSISTANT,
    SYSTEM
}
```

### MessageContent

```kotlin
sealed class MessageContent {
    data class Text(val text: String) : MessageContent()
    data class Component(
        val componentName: String,
        val props: Map<String, JsonElement>
    ) : MessageContent()
    data class Mixed(val parts: List<MessageContent>) : MessageContent()
}
```

### MessageStreamEvent

```kotlin
sealed class MessageStreamEvent {
    data class Delta(val text: String) : MessageStreamEvent()
    data class ComponentStart(
        val componentName: String,
        val componentId: String
    ) : MessageStreamEvent()
    data class ComponentProp(
        val componentId: String,
        val propName: String,
        val propValue: JsonElement
    ) : MessageStreamEvent()
    data class ComponentComplete(val componentId: String) : MessageStreamEvent()
    data class Complete(val message: Message) : MessageStreamEvent()
    data class Error(val message: String) : MessageStreamEvent()
}
```

## Component System

### TamboComponent

```kotlin
interface TamboComponent {
    val name: String
    val description: String
    val propsSchema: ComponentSchema

    @Composable
    fun Render(props: Map<String, JsonElement>)
}
```

### TamboComponentBase

```kotlin
abstract class TamboComponentBase(
    override val name: String,
    override val description: String
) : TamboComponent
```

Base class for creating components. Use `schema {}` to define props.

### ComponentSchema

```kotlin
data class ComponentSchema(
    val properties: Map<String, PropertySchema>,
    val required: List<String> = emptyList()
)
```

### PropertySchema

```kotlin
data class PropertySchema(
    val type: PropertyType,
    val description: String? = null,
    val enum: List<String>? = null,
    val items: PropertySchema? = null,
    val properties: Map<String, PropertySchema>? = null
)
```

### PropertyType

```kotlin
enum class PropertyType {
    STRING,
    NUMBER,
    BOOLEAN,
    ARRAY,
    OBJECT
}
```

### ComponentSchemaBuilder

Builder for component schemas.

#### Methods

```kotlin
fun string(name: String, description: String? = null, required: Boolean = false)
fun number(name: String, description: String? = null, required: Boolean = false)
fun boolean(name: String, description: String? = null, required: Boolean = false)
fun enum(name: String, values: List<String>, description: String? = null, required: Boolean = false)
fun array(name: String, items: PropertySchema, description: String? = null, required: Boolean = false)
fun obj(name: String, properties: Map<String, PropertySchema>, description: String? = null, required: Boolean = false)
```

## Tool System

### TamboTool

```kotlin
interface TamboTool {
    val name: String
    val description: String
    val schema: ToolSchema

    suspend fun execute(parameters: Map<String, JsonElement>): Result<JsonElement>
}
```

### TamboToolBase

```kotlin
abstract class TamboToolBase(
    override val name: String,
    override val description: String
) : TamboTool
```

Base class for creating tools. Use `schema {}` to define parameters.

### ToolSchema

```kotlin
data class ToolSchema(
    val parameters: Map<String, ParameterSchema>,
    val required: List<String> = emptyList()
)
```

### ParameterSchema

```kotlin
data class ParameterSchema(
    val type: ParameterType,
    val description: String? = null,
    val enum: List<String>? = null
)
```

### ParameterType

```kotlin
enum class ParameterType {
    STRING,
    NUMBER,
    BOOLEAN,
    OBJECT,
    ARRAY
}
```

## Compose Integration

### TamboProvider

```kotlin
@Composable
fun TamboProvider(
    config: TamboConfig,
    components: List<TamboComponent> = emptyList(),
    tools: List<TamboTool> = emptyList(),
    content: @Composable () -> Unit
)
```

Main provider for Tambo SDK. Wrap your app content with this.

### useTambo

```kotlin
@Composable
fun useTambo(): TamboState
```

Returns the current Tambo state.

#### TamboState

```kotlin
class TamboState(
    val client: TamboClient,
    val componentRegistry: ComponentRegistry,
    val toolRegistry: ToolRegistry,
    val scope: CoroutineScope
)
```

### useTamboThread

```kotlin
@Composable
fun useTamboThread(threadId: String? = null): ThreadState
```

Creates or loads a thread. If `threadId` is null, creates a new thread.

#### ThreadState

```kotlin
class ThreadState {
    var thread: Thread?
    var isLoading: Boolean
    var error: String?

    suspend fun loadThread()
    suspend fun sendMessage(content: String, metadata: Map<String, String> = emptyMap())
}
```

### useTamboThreadInput

```kotlin
@Composable
fun useTamboThreadInput(threadState: ThreadState): ThreadInputState
```

Manages input state for sending messages.

#### ThreadInputState

```kotlin
class ThreadInputState {
    var value: String
    var isPending: Boolean

    suspend fun submit(metadata: Map<String, String> = emptyMap())
    fun setValue(newValue: String)
}
```

## Pre-built Components

### TamboChat

```kotlin
@Composable
fun TamboChat(
    threadState: ThreadState,
    modifier: Modifier = Modifier,
    placeholder: String = "Type a message..."
)
```

Complete chat interface with message list and input field.

### MessageBubble

```kotlin
@Composable
fun MessageBubble(
    message: Message,
    modifier: Modifier = Modifier
)
```

Individual message bubble with role-based styling.

### LoadingIndicator

```kotlin
@Composable
fun LoadingIndicator(
    modifier: Modifier = Modifier,
    message: String = "Loading..."
)
```

Loading state indicator.

### ErrorMessage

```kotlin
@Composable
fun ErrorMessage(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
)
```

Error display with optional retry button.

## MCP Integration

### MCPServer

```kotlin
data class MCPServer(
    val name: String,
    val url: String,
    val transport: MCPTransport = MCPTransport.HTTP,
    val headers: Map<String, String> = emptyMap()
)
```

### MCPTransport

```kotlin
enum class MCPTransport {
    HTTP,
    WEBSOCKET,
    STDIO
}
```

### MCPTool

```kotlin
data class MCPTool(
    val name: String,
    val description: String,
    val inputSchema: Map<String, Any>
)
```

### MCPPrompt

```kotlin
data class MCPPrompt(
    val name: String,
    val description: String,
    val arguments: List<MCPPromptArgument> = emptyList()
)
```

### MCPResource

```kotlin
data class MCPResource(
    val uri: String,
    val name: String,
    val description: String? = null,
    val mimeType: String? = null
)
```

## Registry Classes

### ComponentRegistry

```kotlin
class ComponentRegistry {
    fun register(component: TamboComponent)
    fun register(vararg components: TamboComponent)
    fun getComponent(name: String): TamboComponent?
    fun getAllComponents(): List<TamboComponent>
    fun unregister(name: String)
    fun clear()
    fun hasComponent(name: String): Boolean
}
```

### ToolRegistry

```kotlin
class ToolRegistry {
    fun register(tool: TamboTool)
    fun register(vararg tools: TamboTool)
    fun getTool(name: String): TamboTool?
    fun getAllTools(): List<TamboTool>
    fun unregister(name: String)
    fun clear()
    fun hasTool(name: String): Boolean
}
```
