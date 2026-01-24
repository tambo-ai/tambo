package co.tambo.sdk.tool

class ToolRegistry {
    private val tools = mutableMapOf<String, TamboTool>()
    
    fun register(tool: TamboTool) {
        tools[tool.name] = tool
    }
    
    fun register(vararg tools: TamboTool) {
        tools.forEach { register(it) }
    }
    
    fun getTool(name: String): TamboTool? {
        return tools[name]
    }
    
    fun getAllTools(): List<TamboTool> {
        return tools.values.toList()
    }
    
    fun unregister(name: String) {
        tools.remove(name)
    }
    
    fun clear() {
        tools.clear()
    }
    
    fun hasTool(name: String): Boolean {
        return tools.containsKey(name)
    }
}
