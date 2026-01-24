package co.tambo.sdk

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
sealed class MessageStreamEvent {
    @Serializable
    data class Delta(val text: String) : MessageStreamEvent()
    
    @Serializable
    data class ComponentStart(
        val componentName: String,
        val componentId: String
    ) : MessageStreamEvent()
    
    @Serializable
    data class ComponentProp(
        val componentId: String,
        val propName: String,
        val propValue: JsonElement
    ) : MessageStreamEvent()
    
    @Serializable
    data class ComponentComplete(val componentId: String) : MessageStreamEvent()
    
    @Serializable
    data class Complete(val message: Message) : MessageStreamEvent()
    
    @Serializable
    data class Error(val message: String) : MessageStreamEvent()
}
