# Zod Schema Patterns

Best practices for schemas that AI generates props from.

## Core Principles

1. **Always add `.describe()`** - AI needs this to understand fields
2. **Use constraints** - `.min()`, `.max()`, `.default()` guide generation
3. **Prefer enums over strings** - Restricts to valid values
4. **Make optional explicit** - Use `.optional()` or `.default()`

## Basic Types

### Strings

```tsx
z.string(); // Any string
z.string().min(1); // Non-empty
z.string().max(100); // Limited length
z.string().describe("User's display name"); // With description
z.string().url(); // Valid URL
z.string().email(); // Valid email
z.string().datetime(); // ISO datetime
```

### Numbers

```tsx
z.number(); // Any number
z.number().int(); // Integer only
z.number().min(0); // Non-negative
z.number().max(100); // Bounded
z.number().min(0).max(5); // Range
z.number().default(10); // With default
```

### Booleans

```tsx
z.boolean(); // true or false
z.boolean().default(true); // Default value
z.boolean().describe("Show the header section");
```

### Enums

```tsx
// String literals (preferred)
z.enum(["small", "medium", "large"]);

// With description
z.enum(["asc", "desc"]).describe("Sort direction");

// With default
z.enum(["active", "inactive", "pending"]).default("active");
```

## Complex Types

### Arrays

```tsx
// Simple array
z.array(z.string());

// With constraints
z.array(z.string()).min(1).max(10);

// Array of objects
z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    value: z.number(),
  }),
);

// With description
z.array(z.string()).describe("Tags to apply, max 5").max(5);
```

### Objects

```tsx
// Basic object
z.object({
  name: z.string(),
  age: z.number(),
});

// Nested (keep shallow - max 2 levels)
z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
});

// Optional object
z.object({
  config: z
    .object({
      debug: z.boolean(),
    })
    .optional(),
});
```

### Optional vs Default

```tsx
// Optional - AI may or may not include
showHeader: z.boolean().optional();
// AI can generate: { } or { showHeader: true }

// Default - always has a value
showHeader: z.boolean().default(true);
// AI can generate: { } (uses default) or { showHeader: false }

// Prefer defaults when there's a sensible fallback
```

## Real-World Examples

### Chat Message

```tsx
export const messageSchema = z.object({
  id: z.string().describe("Unique message identifier"),
  role: z
    .enum(["user", "assistant", "system"])
    .describe("Who sent the message"),
  content: z.string().describe("Message text content"),
  timestamp: z.string().datetime().optional().describe("When sent"),
});
```

### Data Table

```tsx
export const dataTableSchema = z.object({
  columns: z
    .array(
      z.object({
        key: z.string().describe("Column identifier"),
        header: z.string().describe("Column header text"),
        sortable: z.boolean().default(false),
      }),
    )
    .min(1)
    .describe("Table columns"),

  rows: z.array(z.record(z.unknown())).describe("Row data"),

  pagination: z
    .object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      total: z.number().min(0),
    })
    .optional(),
});
```

### Form Field

```tsx
export const formFieldSchema = z.object({
  name: z.string().describe("Field name for submission"),
  label: z.string().describe("Human-readable label"),
  type: z.enum(["text", "email", "password", "number", "select"]),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    )
    .optional()
    .describe("Options for select field"),
});
```

### Chart

```tsx
export const chartSchema = z.object({
  type: z.enum(["line", "bar", "pie"]).describe("Chart type"),
  title: z.string().optional(),
  data: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        color: z.string().optional().describe("Hex color"),
      }),
    )
    .min(1),
  showLegend: z.boolean().default(true),
});
```

## Anti-Patterns

### Too Vague

```tsx
// Bad - AI doesn't know what to generate
z.object({
  data: z.unknown(),
  options: z.record(z.any()),
});

// Good - explicit structure
z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
});
```

### Missing Descriptions

```tsx
// Bad
z.object({
  v: z.number(),
  t: z.string(),
});

// Good
z.object({
  value: z.number().describe("Current metric value"),
  timestamp: z.string().describe("When recorded"),
});
```

### Too Deeply Nested

```tsx
// Bad - hard for AI to generate correctly
z.object({
  config: z.object({
    display: z.object({
      layout: z.object({
        grid: z.object({
          columns: z.number(),
        }),
      }),
    }),
  }),
});

// Good - flattened
z.object({
  columns: z.number().min(1).max(4).default(2).describe("Grid columns"),
  layout: z.enum(["grid", "list"]).default("grid"),
});
```

### Unbounded Arrays

```tsx
// Bad - could be huge
z.array(z.string());

// Good - bounded
z.array(z.string()).max(20).describe("Tags, max 20");
```

## Validation

Test schema generates valid output:

```tsx
const schema = z.object({
  /* ... */
});

// Validate AI output
const result = schema.safeParse(aiGeneratedProps);
if (!result.success) {
  console.error(result.error.issues);
}

// Generate example for testing
const example = {
  /* manually create */
};
schema.parse(example); // throws if invalid
```
