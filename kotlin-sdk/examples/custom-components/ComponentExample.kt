package co.tambo.examples.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import co.tambo.sdk.*
import co.tambo.sdk.component.*
import co.tambo.sdk.compose.*
import kotlinx.serialization.json.*

class WeatherCard : TamboComponentBase(
    name = "WeatherCard",
    description = "Displays weather information with temperature and conditions"
) {
    init {
        schema {
            string("location", "Location name", required = true)
            number("temperature", "Temperature in Celsius", required = true)
            string("condition", "Weather condition", required = true)
            enum("unit", listOf("celsius", "fahrenheit"), "Temperature unit")
        }
    }
    
    @Composable
    override fun Render(props: Map<String, JsonElement>) {
        val location = props["location"]?.jsonPrimitive?.content ?: ""
        val temperature = props["temperature"]?.jsonPrimitive?.int ?: 0
        val condition = props["condition"]?.jsonPrimitive?.content ?: ""
        val unit = props["unit"]?.jsonPrimitive?.content ?: "celsius"
        
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = location,
                    style = MaterialTheme.typography.headlineSmall
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "$temperature°",
                        style = MaterialTheme.typography.displayMedium
                    )
                    Text(
                        text = if (unit == "celsius") "C" else "F",
                        style = MaterialTheme.typography.headlineMedium
                    )
                }
                Text(
                    text = condition,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun ComponentExample() {
    val config = TamboConfig(apiKey = "your-api-key")
    val weatherCard = WeatherCard()
    
    TamboProvider(
        config = config,
        components = listOf(weatherCard)
    ) {
        val threadState = useTamboThread()
        
        MaterialTheme {
            TamboChat(
                threadState = threadState,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
