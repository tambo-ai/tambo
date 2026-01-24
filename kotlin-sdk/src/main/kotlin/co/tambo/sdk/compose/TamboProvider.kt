package co.tambo.sdk.compose

import androidx.compose.runtime.*
import co.tambo.sdk.*
import co.tambo.sdk.component.ComponentRegistry
import co.tambo.sdk.tool.ToolRegistry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class TamboState(
    val client: TamboClient,
    val componentRegistry: ComponentRegistry,
    val toolRegistry: ToolRegistry,
    val scope: CoroutineScope
) {
    var currentThread by mutableStateOf<Thread?>(null)
        private set

    fun updateThread(thread: Thread) {
        currentThread = thread
    }
}

private val LocalTamboState = compositionLocalOf<TamboState?> { null }

@Composable
fun TamboProvider(
    config: TamboConfig,
    components: List<co.tambo.sdk.component.TamboComponent> = emptyList(),
    tools: List<co.tambo.sdk.tool.TamboTool> = emptyList(),
    content: @Composable () -> Unit
) {
    val scope = rememberCoroutineScope()
    val client = remember { TamboClient(config) }
    val componentRegistry = remember { ComponentRegistry() }
    val toolRegistry = remember { ToolRegistry() }
    
    LaunchedEffect(components) {
        componentRegistry.clear()
        components.forEach { componentRegistry.register(it) }
    }
    
    LaunchedEffect(tools) {
        toolRegistry.clear()
        tools.forEach { toolRegistry.register(it) }
    }
    
    val tamboState = remember {
        TamboState(
            client = client,
            componentRegistry = componentRegistry,
            toolRegistry = toolRegistry,
            scope = scope
        )
    }
    
    DisposableEffect(Unit) {
        onDispose {
            client.close()
        }
    }
    
    CompositionLocalProvider(LocalTamboState provides tamboState) {
        content()
    }
}

@Composable
fun useTambo(): TamboState {
    return LocalTamboState.current ?: error("TamboProvider not found in composition")
}
