package co.tambo.examples.tools

import co.tambo.sdk.*
import co.tambo.sdk.tool.*
import co.tambo.sdk.compose.*
import kotlinx.serialization.json.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

class LocationTool : TamboToolBase(
    name = "getCurrentLocation",
    description = "Gets the user's current location"
) {
    init {
        schema {
            boolean("highAccuracy", "Use high accuracy mode")
        }
    }
    
    override suspend fun execute(parameters: Map<String, JsonElement>): Result<JsonElement> {
        return try {
            val location = buildJsonObject {
                put("latitude", 37.7749)
                put("longitude", -122.4194)
                put("city", "San Francisco")
            }
            Result.success(location)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class WeatherTool : TamboToolBase(
    name = "getWeather",
    description = "Fetches weather data for a location"
) {
    init {
        schema {
            string("location", "Location to get weather for", required = true)
            enum("units", listOf("metric", "imperial"), "Temperature units")
        }
    }
    
    override suspend fun execute(parameters: Map<String, JsonElement>): Result<JsonElement> {
        return try {
            val location = parameters["location"]?.jsonPrimitive?.content ?: ""
            
            val weather = buildJsonObject {
                put("temperature", 22)
                put("condition", "Sunny")
                put("humidity", 65)
                put("location", location)
            }
            Result.success(weather)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

@Composable
fun ToolsExample() {
    val config = TamboConfig(apiKey = "your-api-key")
    
    TamboProvider(
        config = config,
        tools = listOf(
            LocationTool(),
            WeatherTool()
        )
    ) {
        val threadState = useTamboThread()
        
        androidx.compose.material3.MaterialTheme {
            co.tambo.sdk.compose.components.TamboChat(
                threadState = threadState,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
