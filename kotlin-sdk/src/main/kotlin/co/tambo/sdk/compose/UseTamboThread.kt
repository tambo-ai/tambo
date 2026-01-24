package co.tambo.sdk.compose

import androidx.compose.runtime.*
import co.tambo.sdk.*
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

class ThreadState(
    private val tamboState: TamboState,
    val threadId: String
) {
    var thread by mutableStateOf<Thread?>(null)
        private set
    
    var isLoading by mutableStateOf(false)
        private set
    
    var error by mutableStateOf<String?>(null)
        private set
    
    suspend fun loadThread() {
        isLoading = true
        error = null
        
        tamboState.client.getThread(threadId)
            .onSuccess { 
                thread = it
                tamboState.updateThread(it)
            }
            .onFailure { 
                error = it.message 
            }
        
        isLoading = false
    }
    
    suspend fun sendMessage(content: String, metadata: Map<String, String> = emptyMap()) {
        isLoading = true
        error = null
        
        try {
            tamboState.client.sendMessage(threadId, content, metadata).collect { event ->
                when (event) {
                    is MessageStreamEvent.Complete -> {
                        val updatedMessages = thread?.messages.orEmpty() + event.message
                        thread = thread?.copy(messages = updatedMessages)
                    }
                    is MessageStreamEvent.Error -> {
                        error = event.message
                    }
                    else -> {}
                }
            }
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }
}

@Composable
fun useTamboThread(threadId: String? = null): ThreadState {
    val tamboState = useTambo()
    val actualThreadId = threadId ?: remember { java.util.UUID.randomUUID().toString() }
    
    val threadState = remember(actualThreadId) {
        ThreadState(tamboState, actualThreadId)
    }
    
    LaunchedEffect(actualThreadId) {
        if (threadId != null) {
            threadState.loadThread()
        } else {
            tamboState.client.createThread()
                .onSuccess { threadState.thread = it }
                .onFailure { threadState.error = it.message }
        }
    }
    
    return threadState
}
