# Component Examples

This directory contains examples of custom Tambo components.

## WeatherCard Component

A material design weather card that displays:

- Location name
- Temperature
- Weather condition
- Temperature unit (Celsius/Fahrenheit)

### Usage

```kotlin
val weatherCard = WeatherCard()

TamboProvider(
    config = config,
    components = listOf(weatherCard)
) {
    ChatScreen()
}
```

### Example Prompt

"Show me the weather in Paris"

The AI will automatically render the WeatherCard component with appropriate data.

## Creating Your Own Components

1. Extend `TamboComponentBase`
2. Define the component name and description
3. Create a schema with `schema {}`
4. Implement the `Render` composable function

```kotlin
class MyComponent : TamboComponentBase(
    name = "MyComponent",
    description = "Description of what this component does"
) {
    init {
        schema {
            string("title", "Title text", required = true)
            number("count", "Number to display")
        }
    }

    @Composable
    override fun Render(props: Map<String, JsonElement>) {
        val title = props["title"]?.jsonPrimitive?.content ?: ""
        val count = props["count"]?.jsonPrimitive?.int ?: 0

        Card {
            Column {
                Text(title)
                Text("Count: $count")
            }
        }
    }
}
```

## Schema Types

- `string()` - Text values
- `number()` - Numeric values
- `boolean()` - True/false values
- `enum()` - Predefined list of values
- `array()` - Array of items
- `obj()` - Nested object with properties

See the API documentation for more details.
