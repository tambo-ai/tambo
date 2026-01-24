# Getting Started with Tambo Kotlin SDK

This guide will help you build your first Android app with Tambo AI.

## Prerequisites

- Android Studio Arctic Fox or later
- Kotlin 2.0+
- Minimum SDK: API 24 (Android 7.0)
- Jetpack Compose 1.7+

## Step 1: Create a New Android Project

1. Open Android Studio
2. Create a new project with "Empty Compose Activity"
3. Set minimum SDK to API 24

## Step 2: Add Dependencies

Add to your app's `build.gradle.kts`:

```kotlin
dependencies {
    implementation("co.tambo:tambo-kotlin-sdk:0.1.0")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.compose.ui:ui:1.7.6")
    implementation("androidx.activity:activity-compose:1.9.3")
}
```

Sync your project.

## Step 3: Get Your API Key

1. Visit https://tambo.co
2. Sign up for a free account
3. Create a new project
4. Copy your API key

## Step 4: Create Your First Chat App

Replace your `MainActivity.kt`:

```kotlin
package com.example.myapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import co.tambo.sdk.*
import co.tambo.sdk.compose.*
import co.tambo.sdk.compose.components.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyTamboApp()
        }
    }
}

@Composable
fun MyTamboApp() {
    val config = TamboConfig(
        apiKey = "YOUR_API_KEY_HERE"
    )

    TamboProvider(config = config) {
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
fun ChatScreen() {
    val threadState = useTamboThread()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AI Assistant") }
            )
        }
    ) { padding ->
        TamboChat(
            threadState = threadState,
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        )
    }
}
```

## Step 5: Run Your App

1. Connect your Android device or start an emulator
2. Click "Run" in Android Studio
3. Start chatting with your AI assistant

## Step 6: Add a Custom Component

Create a weather component:

```kotlin
package com.example.myapp.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import co.tambo.sdk.component.*
import kotlinx.serialization.json.*

class WeatherCard : TamboComponentBase(
    name = "WeatherCard",
    description = "Shows weather information for a location"
) {
    init {
        schema {
            string("city", "City name", required = true)
            number("temperature", "Temperature in Celsius", required = true)
            string("condition", "Weather condition", required = true)
            string("icon", "Weather icon emoji")
        }
    }

    @Composable
    override fun Render(props: Map<String, JsonElement>) {
        val city = props["city"]?.jsonPrimitive?.content ?: ""
        val temp = props["temperature"]?.jsonPrimitive?.int ?: 0
        val condition = props["condition"]?.jsonPrimitive?.content ?: ""
        val icon = props["icon"]?.jsonPrimitive?.content ?: "☀️"

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Row(
                modifier = Modifier.padding(24.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = city,
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = condition,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                    Text(
                        text = icon,
                        style = MaterialTheme.typography.displayMedium
                    )
                    Text(
                        text = "$temp°C",
                        style = MaterialTheme.typography.headlineLarge
                    )
                }
            }
        }
    }
}
```

Register it in your app:

```kotlin
@Composable
fun MyTamboApp() {
    val config = TamboConfig(apiKey = "YOUR_API_KEY_HERE")

    TamboProvider(
        config = config,
        components = listOf(WeatherCard())
    ) {
        MaterialTheme {
            Surface(modifier = Modifier.fillMaxSize()) {
                ChatScreen()
            }
        }
    }
}
```

Now ask: "Show me the weather in Paris"

## Step 7: Add a Tool

Create a location tool:

```kotlin
package com.example.myapp.tools

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import co.tambo.sdk.tool.*
import kotlinx.serialization.json.*

class GetLocationTool(private val context: Context) : TamboToolBase(
    name = "getLocation",
    description = "Gets the user's current location"
) {
    init {
        schema {
            boolean("highAccuracy", "Use high accuracy GPS")
        }
    }

    override suspend fun execute(
        parameters: Map<String, JsonElement>
    ): Result<JsonElement> {
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return Result.failure(
                Exception("Location permission not granted")
            )
        }

        return try {
            val location = buildJsonObject {
                put("latitude", 48.8566)
                put("longitude", 2.3522)
                put("city", "Paris")
            }
            Result.success(location)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

Register it:

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyTamboApp(context = this)
        }
    }
}

@Composable
fun MyTamboApp(context: Context) {
    val config = TamboConfig(apiKey = "YOUR_API_KEY_HERE")

    TamboProvider(
        config = config,
        components = listOf(WeatherCard()),
        tools = listOf(GetLocationTool(context))
    ) {
        MaterialTheme {
            Surface(modifier = Modifier.fillMaxSize()) {
                ChatScreen()
            }
        }
    }
}
```

## Next Steps

- Explore more examples in the `examples/` directory
- Read the full API documentation in `README.md`
- Join the Discord community for support
- Check out pre-built components at https://ui.tambo.co

## Troubleshooting

### Build Errors

Make sure you have:

- Kotlin 2.0+ configured
- Jetpack Compose enabled
- Minimum SDK 24

### Network Errors

- Check your API key is correct
- Verify internet permissions in AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### Component Not Rendering

- Verify component is registered in TamboProvider
- Check schema matches the props being sent
- Enable debug logs: `TamboConfig(enableDebugLogs = true)`

## Support

- Documentation: https://docs.tambo.co
- Discord: https://discord.gg/dJNvPEHth6
- GitHub Issues: https://github.com/tambo-ai/tambo/issues
