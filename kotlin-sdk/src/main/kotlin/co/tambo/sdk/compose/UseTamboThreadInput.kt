package co.tambo.sdk.compose

import androidx.compose.runtime.*
import kotlinx.coroutines.launch

class ThreadInputState(
    private val threadState: ThreadState
) {
    var value by mutableStateOf("")
    var isPending by mutableStateOf(false)
        private set
    
    suspend fun submit(metadata: Map<String, String> = emptyMap()) {
        if (value.isBlank() || isPending) return
        
        isPending = true
        val messageContent = value
        value = ""
        
        try {
            threadState.sendMessage(messageContent, metadata)
        } finally {
            isPending = false
        }
    }
    
    fun setValue(newValue: String) {
        value = newValue
    }
}

@Composable
fun useTamboThreadInput(threadState: ThreadState): ThreadInputState {
    return remember(threadState) {
        ThreadInputState(threadState)
    }
}
