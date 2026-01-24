package co.tambo.examples.basic

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import co.tambo.sdk.*
import co.tambo.sdk.compose.*
import co.tambo.sdk.compose.components.*

@Composable
fun BasicChatApp() {
    val config = TamboConfig(
        apiKey = "your-api-key-here",
        baseUrl = "https://api.tambo.co"
    )
    
    TamboProvider(
        config = config,
        components = emptyList()
    ) {
        MaterialTheme {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                ChatScreen()
            }
        }
    }
}

@Composable
private fun ChatScreen() {
    val threadState = useTamboThread()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tambo Chat") }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            when {
                threadState.error != null -> {
                    ErrorMessage(
                        message = threadState.error ?: "Unknown error",
                        onRetry = {
                            LaunchedEffect(Unit) {
                                threadState.loadThread()
                            }
                        },
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
                threadState.thread == null && threadState.isLoading -> {
                    LoadingIndicator()
                }
                else -> {
                    TamboChat(
                        threadState = threadState,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}
