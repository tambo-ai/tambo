# Basic Chat Example

A minimal chat application demonstrating core Tambo Kotlin SDK functionality.

## What This Example Demonstrates

- Setting up TamboProvider with configuration
- Using useTamboThread hook for thread management
- Handling loading and error states
- Using the pre-built TamboChat component
- Material3 theming and Scaffold layout

## Code Structure

```kotlin
@Composable
fun BasicChatApp() {
    val config = TamboConfig(
        apiKey = "your-api-key-here",
        baseUrl = "https://api.tambo.co"
    )

    TamboProvider(config = config) {
        MaterialTheme {
            Surface {
                ChatScreen()
            }
        }
    }
}

@Composable
private fun ChatScreen() {
    val threadState = useTamboThread()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Tambo Chat") }) }
    ) { padding ->
        when {
            threadState.error != null -> {
                ErrorMessage(
                    message = threadState.error ?: "Unknown error",
                    onRetry = {
                        LaunchedEffect(Unit) {
                            threadState.loadThread()
                        }
                    }
                )
            }
            threadState.thread == null && threadState.isLoading -> {
                LoadingIndicator()
            }
            else -> {
                TamboChat(
                    threadState = threadState,
                    modifier = Modifier.padding(padding)
                )
            }
        }
    }
}
```

## Running This Example

1. Copy this file to your Android project
2. Replace `"your-api-key-here"` with your actual Tambo API key
3. Add the Tambo SDK dependency to your build.gradle.kts
4. Run the app

## Key Components Used

- **TamboProvider** - Provides SDK context to composables
- **useTamboThread** - Hook for thread state management
- **TamboChat** - Pre-built chat UI component
- **ErrorMessage** - Error display with retry
- **LoadingIndicator** - Loading state display

## Minimal Version

For an even simpler version, you can skip error handling:

```kotlin
@Composable
fun MinimalChat() {
    TamboProvider(config = TamboConfig(apiKey = "your-key")) {
        MaterialTheme {
            TamboChat(
                threadState = useTamboThread(),
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
```

## Next Steps

- Add custom components (see custom-components example)
- Add custom tools (see custom-tools example)
- Customize the UI styling
- Add voice input
- Add file upload

See the main README.md for comprehensive documentation.
