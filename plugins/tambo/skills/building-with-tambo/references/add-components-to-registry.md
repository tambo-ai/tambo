# Add Components to Registry

Convert existing React components into Tambo-registered components that AI can render.

## Contents

- [Quick Start](#quick-start)
- [Workflow](#workflow) — analyze, generate Zod schema, write description, register
- [Step 1: Analyze Component](#step-1-analyze-component) — extract props, types, purpose
- [Step 2: Generate Zod Schema](#step-2-generate-zod-schema) — type mapping from TypeScript to Zod
- [Step 3: Write Description](#step-3-write-description) — effective AI trigger descriptions
- [Step 4: Add to Registry](#step-4-add-to-registry) — lib/tambo.ts registration
- [Batch Registration](#batch-registration) — process folders of components
- [Schema File Location](#schema-file-location) — co-located vs dedicated folder
- [Handling Complex Props](#handling-complex-props) — nested objects, callbacks, children
- [Verification](#verification) — test in chat

## Quick Start

```
# Start with the building-with-tambo skill, then follow this guide
# Point to a component file or folder and implement the workflow below
# Example targets:
src/components/ProductCard.tsx
src/components/cards/
```

## Workflow

1. **Read component(s)** - Analyze props, types, and purpose
2. **Generate Zod schema** - Create propsSchema from prop types
3. **Write description** - Help AI know when to use it
4. **Add to registry** - Update lib/tambo.ts

## Step 1: Analyze Component

Read the component file and extract:

- Component name
- Props interface/type
- What it renders (for description)
- Optional vs required props

### Example Input

```tsx
// src/components/ProductCard.tsx
interface ProductCardProps {
  name: string;
  price: number;
  imageUrl?: string;
  onSale?: boolean;
  rating?: number;
}

export function ProductCard({
  name,
  price,
  imageUrl,
  onSale,
  rating,
}: ProductCardProps) {
  return (
    <div className="product-card">
      {imageUrl && <img src={imageUrl} alt={name} />}
      <h3>{name}</h3>
      <p>
        ${price}
        {onSale && " (On Sale!)"}
      </p>
      {rating && <span>★ {rating}/5</span>}
    </div>
  );
}
```

## Step 2: Generate Zod Schema

Convert TypeScript types to Zod with `.describe()`:

```tsx
import { z } from "zod";

export const ProductCardSchema = z.object({
  name: z.string().describe("Product name"),
  price: z.number().describe("Price in dollars"),
  imageUrl: z.string().optional().describe("Product image URL"),
  onSale: z.boolean().optional().describe("Whether product is on sale"),
  rating: z.number().optional().describe("Rating out of 5"),
});
```

### Type Mapping

| TypeScript    | Zod                                      |
| ------------- | ---------------------------------------- |
| `string`      | `z.string()`                             |
| `number`      | `z.number()`                             |
| `boolean`     | `z.boolean()`                            |
| `string[]`    | `z.array(z.string())`                    |
| `"a" \| "b"`  | `z.enum(["a", "b"])`                     |
| `optional`    | `.optional()`                            |
| `Date`        | `z.string().describe("ISO date string")` |
| `Record<K,V>` | `z.record(z.string(), z.number())`       |

## Step 3: Write Description

The description tells AI when to render this component. Be specific:

```tsx
// Bad: Too vague
description: "Shows a product";

// Good: Tells AI when to use it
description: "Displays a product with name, price, and optional image/rating. Use when user asks to see product details, browse items, or view catalog entries.";
```

## Step 4: Add to Registry

```tsx
// lib/tambo.ts
import { TamboComponent } from "@tambo-ai/react";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSchema } from "@/components/ProductCard.schema";

export const components: TamboComponent[] = [
  {
    name: "ProductCard",
    component: ProductCard,
    description:
      "Displays a product with name, price, and optional image/rating. Use when user asks to see product details, browse items, or view catalog entries.",
    propsSchema: ProductCardSchema,
  },
  // ... other components
];
```

## Batch Registration

When given a folder, process all `.tsx` files:

```
src/components/cards/
├── ProductCard.tsx    → Register as "ProductCard"
├── UserCard.tsx       → Register as "UserCard"
├── StatCard.tsx       → Register as "StatCard"
└── index.ts           → Skip (barrel file)
```

Skip files that:

- Are barrel exports (index.ts)
- Don't export React components
- Are test files (_.test.tsx, _.spec.tsx)
- Are story files (\*.stories.tsx)

## Schema File Location

Place schemas next to components:

```
src/components/
├── ProductCard.tsx
├── ProductCard.schema.ts    # Zod schema
├── UserCard.tsx
└── UserCard.schema.ts
```

Or in a dedicated schemas folder:

```
src/
├── components/
│   ├── ProductCard.tsx
│   └── UserCard.tsx
└── schemas/
    ├── ProductCard.schema.ts
    └── UserCard.schema.ts
```

## Handling Complex Props

### Nested Objects

```tsx
// TypeScript
interface Address {
  street: string;
  city: string;
  zip: string;
}
interface Props {
  address: Address;
}

// Zod
const AddressSchema = z.object({
  street: z.string().describe("Street address"),
  city: z.string().describe("City name"),
  zip: z.string().describe("ZIP/postal code"),
});

const PropsSchema = z.object({
  address: AddressSchema.describe("Shipping address"),
});
```

### Callbacks (Skip)

Don't include callbacks in propsSchema - AI can't provide functions:

```tsx
// TypeScript
interface Props {
  name: string;
  onClick: () => void; // Skip this
}

// Zod - only data props
const PropsSchema = z.object({
  name: z.string().describe("Display name"),
  // onClick omitted - AI provides data, not behavior
});
```

### Children (Skip)

Don't include children - AI renders the component, doesn't compose it:

```tsx
// Skip children prop in schema
```

## Verification

After registration, verify in the chat:

> "Show me a product card for a laptop priced at $999"

AI should render the ProductCard with appropriate props.
