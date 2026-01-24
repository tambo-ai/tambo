package co.tambo.sdk.tool

import kotlinx.serialization.json.JsonElement

interface TamboTool {
    val name: String
    val description: String
    val schema: ToolSchema
    
    suspend fun execute(parameters: Map<String, JsonElement>): Result<JsonElement>
}

abstract class TamboToolBase(
    override val name: String,
    override val description: String
) : TamboTool {
    override lateinit var schema: ToolSchema
    
    protected fun schema(builder: ToolSchemaBuilder.() -> Unit) {
        schema = ToolSchemaBuilder().apply(builder).build()
    }
}

data class ToolSchema(
    val parameters: Map<String, ParameterSchema>,
    val required: List<String> = emptyList()
)

data class ParameterSchema(
    val type: ParameterType,
    val description: String? = null,
    val enum: List<String>? = null
)

enum class ParameterType {
    STRING,
    NUMBER,
    BOOLEAN,
    OBJECT,
    ARRAY
}

class ToolSchemaBuilder {
    private val parameters = mutableMapOf<String, ParameterSchema>()
    private val required = mutableListOf<String>()
    
    fun string(
        name: String,
        description: String? = null,
        required: Boolean = false,
        enum: List<String>? = null
    ) {
        parameters[name] = ParameterSchema(ParameterType.STRING, description, enum)
        if (required) this.required.add(name)
    }
    
    fun number(
        name: String,
        description: String? = null,
        required: Boolean = false
    ) {
        parameters[name] = ParameterSchema(ParameterType.NUMBER, description)
        if (required) this.required.add(name)
    }
    
    fun boolean(
        name: String,
        description: String? = null,
        required: Boolean = false
    ) {
        parameters[name] = ParameterSchema(ParameterType.BOOLEAN, description)
        if (required) this.required.add(name)
    }
    
    fun obj(
        name: String,
        description: String? = null,
        required: Boolean = false
    ) {
        parameters[name] = ParameterSchema(ParameterType.OBJECT, description)
        if (required) this.required.add(name)
    }
    
    fun array(
        name: String,
        description: String? = null,
        required: Boolean = false
    ) {
        parameters[name] = ParameterSchema(ParameterType.ARRAY, description)
        if (required) this.required.add(name)
    }
    
    fun build(): ToolSchema {
        return ToolSchema(parameters, required)
    }
}
