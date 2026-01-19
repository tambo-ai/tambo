# Component Conversion Checklist

Step-by-step checklist for converting existing React components to generative UI.

## Pre-Conversion

- [ ] Identify the component to convert
- [ ] Understand current props interface
- [ ] Identify which props AI should generate
- [ ] Check for external dependencies

## Schema Conversion

- [ ] Create Zod schema file or add to component file
- [ ] Convert each prop to Zod type:

| TypeScript       | Zod                           |
| ---------------- | ----------------------------- |
| `string`         | `z.string()`                  |
| `number`         | `z.number()`                  |
| `boolean`        | `z.boolean()`                 |
| `"a" \| "b"`     | `z.enum(["a", "b"])`          |
| `string[]`       | `z.array(z.string())`         |
| `{ x: number }`  | `z.object({ x: z.number() })` |
| `T \| undefined` | `z.X().optional()`            |
| `T \| null`      | `z.X().nullable()`            |

- [ ] Add `.describe()` to every field
- [ ] Add `.default()` for optional fields with sensible defaults
- [ ] Add constraints (`.min()`, `.max()`, etc.)
- [ ] Export schema with naming convention: `{componentName}Schema`

```tsx
// Before
interface CardProps {
  title: string;
  value?: number;
  status: "active" | "inactive";
}

// After
export const cardSchema = z.object({
  title: z.string().describe("Card title displayed at top"),
  value: z.number().optional().describe("Numeric value to display"),
  status: z.enum(["active", "inactive"]).describe("Current status"),
});
```

## Type Derivation

- [ ] Remove old TypeScript interface
- [ ] Derive type from schema

```tsx
// Remove this
interface CardProps {
  title: string;
  // ...
}

// Add this
type CardProps = z.infer<typeof cardSchema>;
```

## Component Updates

- [ ] Import `z` from "zod"
- [ ] Update component to use derived type
- [ ] Add default values in destructuring

```tsx
export function Card({
  title,
  value,
  status = "active"  // Default from schema
}: CardProps) {
```

## Chat Context Sizing

- [ ] Add max-width constraint

```tsx
// Wrap content
<div className="max-w-md">{/* existing content */}</div>
```

- [ ] Ensure responsive at small sizes (test at 300px width)
- [ ] Add text truncation for long content
- [ ] Add max-height with overflow for scrollable content

## Partial Data Handling

- [ ] Handle undefined values gracefully

```tsx
// Before
<h3>{title}</h3>

// After
<h3>{title ?? "Loading..."}</h3>
```

- [ ] Use optional chaining for nested access

```tsx
// Before
{
  user.profile.name;
}

// After
{
  user?.profile?.name ?? "Unknown";
}
```

- [ ] Handle empty arrays

```tsx
{items?.length > 0 ? (
  items.map(...)
) : (
  <EmptyState />
)}
```

## Loading Skeleton

- [ ] Create skeleton component

```tsx
export function CardSkeleton() {
  return (
    <div className="max-w-md p-4 rounded-lg border animate-pulse">
      <div className="h-5 w-32 bg-muted rounded" />
      <div className="mt-2 h-4 w-48 bg-muted rounded" />
    </div>
  );
}
```

- [ ] Match skeleton structure to real component
- [ ] Use same max-width as real component
- [ ] Export skeleton for registration

## File Organization

- [ ] Move component to `src/components/tambo/`

```
# From
src/components/card.tsx

# To
src/components/tambo/card.tsx
```

- [ ] Update file to include:
  - Schema export
  - Type export (optional)
  - Component export
  - Skeleton export

## Registration

- [ ] Add import to `src/components/lib/tambo.ts`

```tsx
import { Card, cardSchema, CardSkeleton } from "../tambo/card";
```

- [ ] Add to componentRegistry

```tsx
{
  name: "Card",
  description: "Shows a card with title, value, and status. Use when displaying metrics, stats, or status information.",
  component: Card,
  propsSchema: cardSchema,
  loadingComponent: CardSkeleton,
}
```

- [ ] Write clear description with trigger phrases

## Import Updates

- [ ] Find all imports of the old component
- [ ] Update to new path

```tsx
// Before
import { Card } from "@/components/card";

// After
import { Card } from "@/components/tambo/card";
```

## Testing

- [ ] Test with full props
- [ ] Test with minimal props (only required)
- [ ] Test with undefined optional props
- [ ] Test at various widths (300px, 400px, 500px)
- [ ] Run TypeScript check: `npm run check-types`
- [ ] Run `/review-agent-component` on converted file

## Final Cleanup

- [ ] Delete old component file (after verifying imports updated)
- [ ] Remove old TypeScript interface if it was in separate file
- [ ] Update any documentation referencing old path

## Quick Reference

```tsx
// Complete converted component structure

import { z } from "zod";

// Schema
export const myComponentSchema = z.object({
  title: z.string().describe("Main title"),
  items: z.array(z.string()).describe("List items"),
  showBorder: z.boolean().default(true).describe("Show border"),
});

// Type
type MyComponentProps = z.infer<typeof myComponentSchema>;

// Component
export function MyComponent({
  title,
  items,
  showBorder = true,
}: MyComponentProps) {
  return (
    <div className={`max-w-md p-4 rounded-lg ${showBorder ? "border" : ""}`}>
      <h3>{title ?? "Loading..."}</h3>
      {items?.length > 0 ? (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No items</p>
      )}
    </div>
  );
}

// Skeleton
export function MyComponentSkeleton() {
  return (
    <div className="max-w-md p-4 rounded-lg border animate-pulse">
      <div className="h-5 w-32 bg-muted rounded" />
      <div className="mt-2 space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    </div>
  );
}
```
