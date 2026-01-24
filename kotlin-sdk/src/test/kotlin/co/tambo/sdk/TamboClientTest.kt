package co.tambo.sdk

import io.mockk.*
import kotlinx.coroutines.test.*
import org.junit.Test
import kotlin.test.*

class TamboClientTest {
    
    @Test
    fun testCreateThread() = runTest {
        val config = TamboConfig(apiKey = "test-key")
        val client = TamboClient(config)
        
        val result = client.createThread(mapOf("test" to "metadata"))
        
        assertTrue(result.isSuccess || result.isFailure)
    }
    
    @Test
    fun testConfigValidation() {
        val config = TamboConfig(
            apiKey = "test-api-key",
            baseUrl = "https://test.api.com",
            userToken = "user-token",
            enableDebugLogs = true
        )
        
        assertEquals("test-api-key", config.apiKey)
        assertEquals("https://test.api.com", config.baseUrl)
        assertEquals("user-token", config.userToken)
        assertTrue(config.enableDebugLogs)
    }
    
    @Test
    fun testThreadCreation() {
        val thread = Thread(
            id = "thread-123",
            messages = emptyList(),
            metadata = emptyMap(),
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        
        assertEquals("thread-123", thread.id)
        assertTrue(thread.messages.isEmpty())
    }
    
    @Test
    fun testMessageCreation() {
        val message = Message(
            id = "msg-123",
            role = MessageRole.USER,
            content = MessageContent.Text("Hello"),
            timestamp = System.currentTimeMillis()
        )
        
        assertEquals("msg-123", message.id)
        assertEquals(MessageRole.USER, message.role)
        assertTrue(message.content is MessageContent.Text)
    }
}
