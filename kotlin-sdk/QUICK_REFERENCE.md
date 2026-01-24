# Tambo Kotlin SDK - Quick Reference

## Installation

```kotlin
dependencies {
    implementation("co.tambo:tambo-kotlin-sdk:0.1.0")
}
```

## Basic Setup

```kotlin
val config = TamboConfig(apiKey = "your-api-key")

TamboProvider(config = config) {
    val threadState = useTamboThread()
    TamboChat(threadState = threadState)
}
```

## Component

```kotlin
class MyComponent : TamboComponentBase(
    name = "MyComponent",
    description = "Component description"
) {
    init {
        schema {
            string("title", "Title text", required = true)
            number("value", "Numeric value")
            boolean("enabled", "Is enabled")
            enum("status", listOf("active", "inactive"))
        }
    }

    @Composable
    override fun Render(props: Map<String, JsonElement>) {
        val title = props["title"]?.jsonPrimitive?.content ?: ""
        Text(title)
    }
}
```

## Tool

```kotlin
class MyTool : TamboToolBase(
    name = "myTool",
    description = "Tool description"
) {
    init {
        schema {
            string("param", "Parameter", required = true)
        }
    }

    override suspend fun execute(
        parameters: Map<String, JsonElement>
    ): Result<JsonElement> {
        return try {
            val result = buildJsonObject {
                put("success", true)
            }
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

## Hooks

```kotlin
val tamboState = useTambo()
val threadState = useTamboThread()
val inputState = useTamboThreadInput(threadState)

scope.launch {
    threadState.sendMessage("Hello")
}

TextField(
    value = inputState.value,
    onValueChange = { inputState.setValue(it) }
)

Button(onClick = { scope.launch { inputState.submit() } }) {
    Text("Send")
}
```

## Components

```kotlin
TamboChat(threadState = threadState)

MessageBubble(message = message)

LoadingIndicator(message = "Loading...")

ErrorMessage(
    message = "Error occurred",
    onRetry = { retry() }
)
```

## Schema Types

```kotlin
schema {
    string("name", "Description", required = true)
    number("count", "Numeric value")
    boolean("flag", "Boolean value")
    enum("type", listOf("a", "b", "c"))
    array("items", PropertySchema(PropertyType.STRING))
    obj("metadata", mapOf(
        "key" to PropertySchema(PropertyType.STRING)
    ))
}
```

## Configuration

```kotlin
TamboConfig(
    apiKey = "key",
    baseUrl = "https://api.tambo.co",
    userToken = "user-token",
    enableDebugLogs = true
)
```

## Streaming

```kotlin
client.sendMessage(threadId, "Hello").collect { event ->
    when (event) {
        is MessageStreamEvent.Delta -> {}
        is MessageStreamEvent.ComponentStart -> {}
        is MessageStreamEvent.ComponentProp -> {}
        is MessageStreamEvent.Complete -> {}
        is MessageStreamEvent.Error -> {}
    }
}
```

## Thread Management

```kotlin
client.createThread(metadata)
client.getThread(threadId)
client.deleteThread(threadId)
```

## Error Handling

```kotlin
threadState.error?.let { error ->
    ErrorMessage(message = error)
}

if (threadState.isLoading) {
    LoadingIndicator()
}
```
