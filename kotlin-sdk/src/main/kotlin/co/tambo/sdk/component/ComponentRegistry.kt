package co.tambo.sdk.component

class ComponentRegistry {
    private val components = mutableMapOf<String, TamboComponent>()
    
    fun register(component: TamboComponent) {
        components[component.name] = component
    }
    
    fun register(vararg components: TamboComponent) {
        components.forEach { register(it) }
    }
    
    fun getComponent(name: String): TamboComponent? {
        return components[name]
    }
    
    fun getAllComponents(): List<TamboComponent> {
        return components.values.toList()
    }
    
    fun unregister(name: String) {
        components.remove(name)
    }
    
    fun clear() {
        components.clear()
    }
    
    fun hasComponent(name: String): Boolean {
        return components.containsKey(name)
    }
}
