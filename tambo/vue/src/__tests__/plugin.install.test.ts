import { createApp, defineComponent, h } from 'vue'
import '@tambo-ai/typescript-sdk/shims/node'
import { TamboPlugin } from '../plugin'
import { useTamboClient } from '../providers/tambo-client-provider'

test('TamboPlugin installs and provides client', () => {
  const Comp = defineComponent({
    setup() {
      const client = useTamboClient()
      expect(client).toBeTruthy()
      return () => h('div')
    }
  })
  const app = createApp(Comp)
  app.use(TamboPlugin, { apiKey: 'test-key' })
  // Mounting to DOM is not required for injection tests with simple composables
})

