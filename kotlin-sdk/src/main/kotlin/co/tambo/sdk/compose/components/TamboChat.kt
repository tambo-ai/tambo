package co.tambo.sdk.compose.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import co.tambo.sdk.compose.*
import kotlinx.coroutines.launch

@Composable
fun TamboChat(
    threadState: ThreadState,
    modifier: Modifier = Modifier,
    placeholder: String = "Type a message..."
) {
    val inputState = useTamboThreadInput(threadState)
    val scope = rememberCoroutineScope()
    
    Column(
        modifier = modifier.fillMaxSize()
    ) {
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            threadState.thread?.messages?.forEach { message ->
                item(key = message.id) {
                    MessageBubble(message = message)
                }
            }
            
            if (threadState.isLoading) {
                item {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .padding(16.dp)
                            .size(24.dp)
                    )
                }
            }
        }
        
        ChatInput(
            value = inputState.value,
            onValueChange = { inputState.setValue(it) },
            onSend = {
                scope.launch {
                    inputState.submit()
                }
            },
            enabled = !inputState.isPending,
            placeholder = placeholder,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun ChatInput(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    enabled: Boolean,
    placeholder: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text(placeholder) },
                enabled = enabled,
                singleLine = false,
                maxLines = 4
            )
            
            Button(
                onClick = onSend,
                enabled = enabled && value.isNotBlank()
            ) {
                Text("Send")
            }
        }
    }
}
