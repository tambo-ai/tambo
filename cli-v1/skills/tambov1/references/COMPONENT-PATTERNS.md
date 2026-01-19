# Component Patterns Reference

Patterns for building generative UI components that AI assistants render.

## Basic Component Structure

```tsx
import { z } from "zod"

// 1. Define schema with descriptions
export const myComponentSchema = z.object({
  title: z.string().describe("Main heading text"),
  showIcon: z.boolean().default(true).describe("Whether to show the icon"),
  size: z.enum(["sm", "md", "lg"]).default("md").describe("Component size"),
  items: z.array(z.string()).describe("List of items to display"),
})

// 2. Derive TypeScript type from schema
type MyComponentProps = z.infer<typeof myComponentSchema>

// 3. Implement component
export function MyComponent({ title, showIcon = true, size = "md", items }: MyComponentProps) {
  const sizeClasses = {
    sm: "text-sm p-2",
    md: "text-base p-4",
    lg: "text-lg p-6",
  }

  return (
    <div className={`rounded-lg border max-w-md ${sizeClasses[size]}`}>
      <h3 className="font-semibold flex items-center gap-2">
        {showIcon && <Icon />}
        {title}
      </h3>
      <ul className="mt-2">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

// 4. Loading skeleton
export function MyComponentSkeleton() {
  return (
    <div className="rounded-lg border p-4 max-w-md animate-pulse">
      <div className="h-5 w-32 bg-muted rounded" />
      <div className="mt-2 space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    </div>
  )
}
```

## Registration in tambo.ts

```tsx
import { MyComponent, myComponentSchema, MyComponentSkeleton } from "../tambo/my-component"

export const componentRegistry = [
  {
    name: "MyComponent",
    description: "Clear description of what this shows and when AI should use it. Include trigger phrases.",
    component: MyComponent,
    propsSchema: myComponentSchema,
    loadingComponent: MyComponentSkeleton,
  },
]
```

## Streaming State Components

For components where AI updates state after initial render:

```tsx
import { useTamboComponentState } from "@tambo-ai/react"

export function StreamingList({ title, initialItems }: { title: string; initialItems: string[] }) {
  const [items, setItems, { isPending }] = useTamboComponentState(
    "list-items",  // Must be unique
    initialItems
  )

  return (
    <div className="max-w-md p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {isPending && <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>}
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Tool-Connected Components

Components that work with AI tools:

```tsx
import { defineTool } from "@tambo-ai/react"

// 1. Define the tool
export const fetchDataTool = defineTool({
  name: "fetchData",
  description: "Fetch fresh data for the dashboard",
  toolSchema: z.object({
    query: z.string(),
    limit: z.number().default(10),
  }),
  tool: async ({ query, limit }) => {
    const results = await api.search(query, limit)
    return { results }
  },
})

// 2. Associate tool with component in tambo.ts
export const toolAssociations = {
  Dashboard: ["fetchData"],
}
```

## Chat-Friendly Sizing

Components render in chat bubbles. Always constrain width:

```tsx
// Good - constrained width
<div className="max-w-md p-4 rounded-lg border">

// Good - responsive constraints
<div className="w-full max-w-sm md:max-w-md">

// Bad - will stretch full width
<div className="w-full p-4">
```

## Handling Partial Data

During streaming, data may be incomplete:

```tsx
export function DataCard({ title, value, items }: DataCardProps) {
  return (
    <div className="max-w-md p-4 rounded-lg border">
      {/* Safe - handles undefined */}
      <h3>{title || "Loading..."}</h3>

      {/* Safe - optional chaining */}
      <p>{value?.toLocaleString() ?? "—"}</p>

      {/* Safe - handles missing array */}
      {items?.map((item, i) => (
        <div key={i}>{item}</div>
      ))}

      {/* Empty state */}
      {items?.length === 0 && (
        <p className="text-muted-foreground">No items</p>
      )}
    </div>
  )
}
```

## Common Patterns

### Card with Status
```tsx
const statusColors = {
  success: "text-green-600 bg-green-50",
  warning: "text-yellow-600 bg-yellow-50",
  error: "text-red-600 bg-red-50",
}

<span className={`px-2 py-1 rounded text-sm ${statusColors[status]}`}>
  {status}
</span>
```

### Metric with Trend
```tsx
<div className="flex items-baseline gap-2">
  <span className="text-2xl font-bold">{value}</span>
  <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
    {change >= 0 ? "+" : ""}{change}%
  </span>
</div>
```

### List with Actions
```tsx
<ul className="divide-y">
  {items.map((item) => (
    <li key={item.id} className="py-2 flex justify-between items-center">
      <span>{item.label}</span>
      <button className="text-sm text-muted-foreground hover:text-foreground">
        View
      </button>
    </li>
  ))}
</ul>
```

### Collapsible Section
```tsx
const [open, setOpen] = useState(false)

<div className="border rounded-lg">
  <button
    onClick={() => setOpen(!open)}
    className="w-full p-4 flex justify-between items-center"
  >
    <span>{title}</span>
    <ChevronIcon className={`transform ${open ? "rotate-180" : ""}`} />
  </button>
  {open && <div className="p-4 border-t">{children}</div>}
</div>
```

## Styling Conventions

Use Tailwind. Common patterns:

```tsx
// Cards
<div className="rounded-lg border bg-card p-4 shadow-sm">

// Subtle backgrounds
<div className="bg-muted/50 rounded-md p-2">

// Interactive elements
<button className="hover:bg-accent transition-colors rounded-md px-3 py-1.5">

// Muted text
<span className="text-sm text-muted-foreground">

// Truncated text
<p className="truncate">

// Scrollable with max height
<div className="max-h-64 overflow-auto">
```

## Accessibility

- Use semantic HTML (`button`, `nav`, `main`, `article`)
- Include `aria-label` for icon-only buttons
- Ensure color contrast meets WCAG AA
- Support keyboard navigation

```tsx
<button
  aria-label="Close dialog"
  className="p-2 hover:bg-accent rounded"
  onClick={onClose}
>
  <XIcon className="h-4 w-4" />
</button>
```
