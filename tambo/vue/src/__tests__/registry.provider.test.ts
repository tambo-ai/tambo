import { defineComponent, h, getCurrentInstance, provide } from 'vue'
import { createTamboRegistryContext, TamboRegistryKey } from '../providers/tambo-registry-provider'

test('registry provider registers tools and components', () => {
  const Comp = defineComponent({
    setup() {
      const ctx = createTamboRegistryContext()
      // simulate provide in setup
      provide(TamboRegistryKey, ctx)
      ctx.registerTool({
        name: 'tool-a', description: 'A', tool: () => 'ok', toolSchema: { type: 'object' } as any
      })
      expect(ctx.toolRegistry['tool-a']).toBeTruthy()
      return () => h('div')
    }
  })
  // Just invoke setup
  Comp.setup?.({}, { attrs: {}, slots: {}, emit: () => {} } as any)
})

