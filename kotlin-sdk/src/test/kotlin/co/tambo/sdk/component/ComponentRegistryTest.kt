package co.tambo.sdk.component

import org.junit.Test
import kotlin.test.*

class ComponentRegistryTest {
    
    @Test
    fun testRegisterComponent() {
        val registry = ComponentRegistry()
        val component = MockComponent()
        
        registry.register(component)
        
        assertTrue(registry.hasComponent("TestComponent"))
        assertEquals(component, registry.getComponent("TestComponent"))
    }
    
    @Test
    fun testUnregisterComponent() {
        val registry = ComponentRegistry()
        val component = MockComponent()
        
        registry.register(component)
        registry.unregister("TestComponent")
        
        assertFalse(registry.hasComponent("TestComponent"))
        assertNull(registry.getComponent("TestComponent"))
    }
    
    @Test
    fun testGetAllComponents() {
        val registry = ComponentRegistry()
        val component1 = MockComponent("Component1")
        val component2 = MockComponent("Component2")
        
        registry.register(component1, component2)
        
        val all = registry.getAllComponents()
        assertEquals(2, all.size)
    }
    
    @Test
    fun testClearRegistry() {
        val registry = ComponentRegistry()
        registry.register(MockComponent(), MockComponent("Another"))
        
        registry.clear()
        
        assertEquals(0, registry.getAllComponents().size)
    }
    
    private class MockComponent(
        name: String = "TestComponent"
    ) : TamboComponentBase(name, "Test component") {
        init {
            schema {
                string("test", "Test property")
            }
        }
        
        @androidx.compose.runtime.Composable
        override fun Render(props: Map<String, kotlinx.serialization.json.JsonElement>) {
        }
    }
}
