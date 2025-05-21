---
title: Known Issues
description: Current limitations and work-arounds when using Tambo.
sidebar_position: 100
---

## Schemas

### `.records()` does not work

The `zod` `record()` / `.records()` helper (or any schema that compiles down to **JSON Schema “object with arbitrary keys”**) is **not supported** by Tambo at the moment.  
Tambo’s internal code-generation layer needs a deterministic list of property names so it can:

- Describe props to the model in natural language
- Generate stable TypeScript types
- Build JSON Schema for component validation

Because `.records()` allows _any_ key at runtime, Tambo cannot reliably perform those steps.

#### Recommended workaround – use `array()` instead

Instead of:

```ts
const propsSchema = z.record(
  z.object({
    label: z.string(),
    value: z.number(),
  }),
);
```

Structure your data as an **array**:

```ts
const propsSchema = z.array(
  z.object({
    id: z.string(), // ← explicit key instead of the object key
    label: z.string(),
    value: z.number(),
  }),
);
```

Now each entry has an explicit `id` (or `key`) field, giving the model clear, predictable property names to work with.  
If you already have data in record form, convert it on the fly:

```ts
// From { foo: { label: "Foo", value: 1 }, bar: { ... } }
// To   [ { id: "foo", label: "Foo", value: 1 }, ... ]
const asArray = Object.entries(recordData).map(([id, rest]) => ({
  id,
  ...rest,
}));
```

---

### Still need help?

Want to see all currently reported bugs **or** file a new one? Head over to GitHub:

[View open bug issues ›](https://github.com/tambo-ai/tambo/issues?q=is%3Aissue+is%3Aopen+label%3Abug)
