# Tool Examples

This directory contains examples of custom Tambo tools.

## GetLocationTool

Gets the user's current GPS location.

### Features

- Requests location permission
- Returns latitude, longitude, and city
- Supports high accuracy mode

### Usage

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TamboProvider(
                config = config,
                tools = listOf(GetLocationTool(this))
            ) {
                ChatScreen()
            }
        }
    }
}
```

### Required Permissions

Add to AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## GetWeatherTool

Fetches weather data for a location.

### Parameters

- `location` (required) - Location to get weather for
- `units` (optional) - "metric" or "imperial"

### Response

- `temperature` - Current temperature
- `condition` - Weather condition
- `humidity` - Humidity percentage
- `location` - Location name

## Creating Your Own Tools

1. Extend `TamboToolBase`
2. Define the tool name and description
3. Create a schema for parameters
4. Implement the `execute` function

```kotlin
class MyTool : TamboToolBase(
    name = "myTool",
    description = "What this tool does"
) {
    init {
        schema {
            string("param1", "First parameter", required = true)
            number("param2", "Second parameter")
        }
    }

    override suspend fun execute(
        parameters: Map<String, JsonElement>
    ): Result<JsonElement> {
        val param1 = parameters["param1"]?.jsonPrimitive?.content

        return try {
            val result = buildJsonObject {
                put("result", "Success")
                put("value", 123)
            }
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

## Best Practices

1. Always validate parameters
2. Handle errors gracefully
3. Return structured JSON data
4. Use descriptive parameter names
5. Add clear descriptions
6. Keep tools focused and simple
7. Request permissions appropriately

See the API documentation for more details.
