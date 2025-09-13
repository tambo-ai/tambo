import { defineComponent, h } from 'vue'
import { provideTamboRegistry, useTamboRegistry } from '../providers/tambo-registry-provider'

test('registry provider registers tools and components', () => {
  const Comp = defineComponent({
    setup() {
      const ctx = provideTamboRegistry()
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

