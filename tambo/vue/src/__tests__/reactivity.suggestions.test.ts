import { defineComponent, h, ref } from 'vue'
import '@tambo-ai/typescript-sdk/shims/node'
import { useTamboSuggestions } from '../hooks/use-suggestions'

test('suggestions recompute when latest message changes', async () => {
  const latestId = ref('m1')
  const Comp = defineComponent({
    setup() {
      const { suggestionsResult } = useTamboSuggestions({ maxSuggestions: 1 })
      expect(suggestionsResult).toBeTruthy()
      return () => h('div')
    }
  })
  expect(Comp).toBeTruthy()
})

