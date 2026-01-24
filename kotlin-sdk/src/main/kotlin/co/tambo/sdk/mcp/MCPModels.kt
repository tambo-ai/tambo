package co.tambo.sdk.mcp

import kotlinx.serialization.Serializable

@Serializable
data class MCPServer(
    val name: String,
    val url: String,
    val transport: MCPTransport = MCPTransport.HTTP,
    val headers: Map<String, String> = emptyMap()
)

@Serializable
enum class MCPTransport {
    HTTP,
    WEBSOCKET,
    STDIO
}

@Serializable
data class MCPTool(
    val name: String,
    val description: String,
    val inputSchema: Map<String, Any>
)

@Serializable
data class MCPPrompt(
    val name: String,
    val description: String,
    val arguments: List<MCPPromptArgument> = emptyList()
)

@Serializable
data class MCPPromptArgument(
    val name: String,
    val description: String,
    val required: Boolean = false
)

@Serializable
data class MCPResource(
    val uri: String,
    val name: String,
    val description: String? = null,
    val mimeType: String? = null
)
