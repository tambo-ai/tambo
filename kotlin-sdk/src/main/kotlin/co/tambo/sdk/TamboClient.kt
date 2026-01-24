package co.tambo.sdk

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.websocket.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.websocket.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString

class TamboClient(private val config: TamboConfig) {
    private val httpClient = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }
        install(WebSockets)
    }

    private fun getHeaders(): HeadersBuilder.() -> Unit = {
        append("Authorization", "Bearer ${config.apiKey}")
        config.userToken?.let { append("X-User-Token", it) }
        append("Content-Type", "application/json")
    }

    suspend fun createThread(metadata: Map<String, String> = emptyMap()): Result<Thread> {
        return try {
            val response = httpClient.post("${config.baseUrl}/v1/threads") {
                headers(getHeaders())
                setBody(metadata)
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getThread(threadId: String): Result<Thread> {
        return try {
            val response = httpClient.get("${config.baseUrl}/v1/threads/$threadId") {
                headers(getHeaders())
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendMessage(
        threadId: String,
        content: String,
        metadata: Map<String, String> = emptyMap()
    ): Flow<MessageStreamEvent> = flow {
        try {
            httpClient.webSocket(
                method = HttpMethod.Get,
                host = config.baseUrl.removePrefix("https://").removePrefix("http://"),
                path = "/v1/threads/$threadId/messages/stream",
                request = {
                    headers(getHeaders())
                }
            ) {
                val messageData = Json.encodeToString(
                    mapOf(
                        "content" to content,
                        "metadata" to metadata
                    )
                )
                send(Frame.Text(messageData))

                while (true) {
                    val frame = incoming.receive()
                    if (frame is Frame.Text) {
                        val event = Json.decodeFromString<MessageStreamEvent>(frame.readText())
                        emit(event)
                        if (event is MessageStreamEvent.Complete) break
                    }
                }
            }
        } catch (e: Exception) {
            emit(MessageStreamEvent.Error(e.message ?: "Unknown error"))
        }
    }

    suspend fun deleteThread(threadId: String): Result<Unit> {
        return try {
            httpClient.delete("${config.baseUrl}/v1/threads/$threadId") {
                headers(getHeaders())
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun close() {
        httpClient.close()
    }
}
