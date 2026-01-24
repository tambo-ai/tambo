package co.tambo.sdk.component

import androidx.compose.runtime.Composable
import kotlinx.serialization.json.JsonElement
import kotlin.reflect.KClass

interface TamboComponent {
    val name: String
    val description: String
    val propsSchema: ComponentSchema
    
    @Composable
    fun Render(props: Map<String, JsonElement>)
}

abstract class TamboComponentBase(
    override val name: String,
    override val description: String
) : TamboComponent {
    override lateinit var propsSchema: ComponentSchema
    
    protected fun schema(builder: ComponentSchemaBuilder.() -> Unit) {
        propsSchema = ComponentSchemaBuilder().apply(builder).build()
    }
}

data class ComponentSchema(
    val properties: Map<String, PropertySchema>,
    val required: List<String> = emptyList()
)

data class PropertySchema(
    val type: PropertyType,
    val description: String? = null,
    val enum: List<String>? = null,
    val items: PropertySchema? = null,
    val properties: Map<String, PropertySchema>? = null
)

enum class PropertyType {
    STRING,
    NUMBER,
    BOOLEAN,
    ARRAY,
    OBJECT
}

class ComponentSchemaBuilder {
    private val properties = mutableMapOf<String, PropertySchema>()
    private val required = mutableListOf<String>()
    
    fun string(
        name: String,
        description: String? = null,
        required: Boolean = false
    ) {
        properties[name] = PropertySchema(PropertyType.STRING, description)
        if (required) this.required.add(name)
    }
    
    fun number(
        name: String,
        description: String? = null,
        required: Boolean = false
    ) {
        properties[name] = PropertySchema(PropertyType.NUMBER, description)
        if (required) this.required.add(name)
    }
    
    fun boolean(
        name: String,
        description: String? = null,
        required: Boolean = false
    ) {
        properties[name] = PropertySchema(PropertyType.BOOLEAN, description)
        if (required) this.required.add(name)
    }
    
    fun enum(
        name: String,
        values: List<String>,
        description: String? = null,
        required: Boolean = false
    ) {
        properties[name] = PropertySchema(PropertyType.STRING, description, enum = values)
        if (required) this.required.add(name)
    }
    
    fun array(
        name: String,
        items: PropertySchema,
        description: String? = null,
        required: Boolean = false
    ) {
        properties[name] = PropertySchema(PropertyType.ARRAY, description, items = items)
        if (required) this.required.add(name)
    }
    
    fun obj(
        name: String,
        properties: Map<String, PropertySchema>,
        description: String? = null,
        required: Boolean = false
    ) {
        this.properties[name] = PropertySchema(
            PropertyType.OBJECT,
            description,
            properties = properties
        )
        if (required) this.required.add(name)
    }
    
    fun build(): ComponentSchema {
        return ComponentSchema(properties, required)
    }
}
