package co.tambo.sdk

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class TamboConfig(
    val apiKey: String,
    val baseUrl: String = "https://api.tambo.co",
    val userToken: String? = null,
    val enableDebugLogs: Boolean = false
)

@Serializable
data class Message(
    val id: String,
    val role: MessageRole,
    val content: MessageContent,
    val timestamp: Long = System.currentTimeMillis(),
    val metadata: Map<String, JsonElement> = emptyMap()
)

@Serializable
enum class MessageRole {
    USER,
    ASSISTANT,
    SYSTEM
}

@Serializable
sealed class MessageContent {
    @Serializable
    data class Text(val text: String) : MessageContent()
    
    @Serializable
    data class Component(
        val componentName: String,
        val props: Map<String, JsonElement>
    ) : MessageContent()
    
    @Serializable
    data class Mixed(val parts: List<MessageContent>) : MessageContent()
}

@Serializable
data class Thread(
    val id: String,
    val messages: List<Message> = emptyList(),
    val metadata: Map<String, JsonElement> = emptyMap(),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
data class StreamStatus(
    val isStreaming: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)

@Serializable
data class PropStatus(
    val propName: String,
    val isStreaming: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)
