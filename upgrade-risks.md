# Upgrade Risks – `z.record()` Disallowed

Starting with **tambo v0.11** any use of `z.record()` inside a component `propsSchema`
or a tool `toolSchema` will throw an error at **run-time**.  
  
Why?  
`z.record()` cannot be converted to a deterministic JSON Schema that the Tambo
backend understands. Allowing it created silent mismatches between client and
server, manifesting as hard-to-debug runtime failures. The new validation
performs a deep walk of the Zod schema *including every wrapper type* to ensure
no `z.record()` slips through.

## How to migrate

1. Replace `z.record(ValueSchema)` with `z.object({ key1: ValueSchema, ... })`
   using explicit property names.  
2. If keys are dynamic/unbounded, model them as an **array of objects** instead:
   ```ts
   // ❌ before
   z.record(z.string())
   
   // ✅ after
   z.array(z.object({ key: z.string(), value: z.string() }))
   ```

## CI recommendation
Add a small unit test that simply imports your component registry; the
validation will run during the import and fail your build if a stray
`z.record()` is introduced in future PRs.
