# Streaming Guide

How to build components that handle streaming data and AI updates.

## Why Streaming Matters

When AI generates component props, data arrives incrementally:
1. First, partial data streams in
2. Component must render without crashing
3. Final complete data arrives
4. Component updates smoothly

## Two Types of Streaming

### 1. Streaming Props (Initial Render)

Props arrive as AI generates them. Component must handle partial data.

```tsx
export function DataCard({ title, value, items }: DataCardProps) {
  return (
    <div className="max-w-md p-4 rounded-lg border">
      {/* Handle missing title */}
      <h3>{title ?? <span className="bg-muted animate-pulse w-24 h-5 rounded" />}</h3>

      {/* Handle missing value */}
      <p className="text-2xl font-bold">
        {value !== undefined ? value.toLocaleString() : "—"}
      </p>

      {/* Handle missing/empty array */}
      {items ? (
        items.map((item, i) => <div key={i}>{item}</div>)
      ) : (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      )}
    </div>
  )
}
```

### 2. Streaming State (AI Updates After Render)

AI updates component state via `useTamboComponentState`.

```tsx
import { useTamboComponentState } from "@tambo-ai/react"

export function LiveList({ title, initialItems }: LiveListProps) {
  const [items, setItems, { isPending }] = useTamboComponentState(
    "live-list-items",  // Unique key - REQUIRED
    initialItems
  )

  return (
    <div className="max-w-md p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Updating...
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm">{item}</li>
        ))}
      </ul>
    </div>
  )
}
```

## useTamboComponentState API

```tsx
const [state, setState, options] = useTamboComponentState(key, initialValue)
```

- **`key`** - Unique string identifying this state. Must be unique across all components.
- **`initialValue`** - Starting value
- **`state`** - Current value
- **`setState`** - Update function (AI calls this via tools)
- **`options.isPending`** - True while AI is updating

## Unique Key Requirement

The key MUST be unique. If two components use the same key, they'll share state (usually a bug).

```tsx
// Good - unique keys
useTamboComponentState("user-profile-data", userData)
useTamboComponentState("chat-messages", messages)
useTamboComponentState("dashboard-metrics", metrics)

// Bad - collision risk
useTamboComponentState("data", userData)
useTamboComponentState("items", messages)
```

Pattern for dynamic keys:

```tsx
// Include instance ID for multiple instances
useTamboComponentState(`chart-${chartId}`, chartData)
```

## Loading Skeletons

Provide skeleton for initial load:

```tsx
export function DataCardSkeleton() {
  return (
    <div className="max-w-md p-4 rounded-lg border animate-pulse">
      <div className="h-5 w-32 bg-muted rounded" />
      <div className="mt-2 h-8 w-20 bg-muted rounded" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    </div>
  )
}

// Register with component
{
  name: "DataCard",
  component: DataCard,
  loadingComponent: DataCardSkeleton,
  // ...
}
```

## Skeleton Best Practices

1. **Match real component structure** - Same layout, sizes
2. **Use animate-pulse** - Standard loading animation
3. **Use bg-muted** - Theme-aware placeholder color
4. **Constrain width** - Same max-width as real component

```tsx
// Real component
<div className="max-w-md p-4">
  <h3 className="text-lg font-semibold">Title Here</h3>
  <p className="mt-2 text-sm">Description text...</p>
</div>

// Matching skeleton
<div className="max-w-md p-4 animate-pulse">
  <div className="h-6 w-32 bg-muted rounded" />       {/* Match h3 */}
  <div className="mt-2 h-4 w-48 bg-muted rounded" />  {/* Match p */}
</div>
```

## Handling Partial Props

During streaming, any field might be undefined:

```tsx
interface CardProps {
  title: string
  value: number
  items: string[]
}

export function Card({ title, value, items }: CardProps) {
  // Title might be streaming
  const displayTitle = title || "Loading..."

  // Value might not exist yet
  const displayValue = value !== undefined
    ? value.toLocaleString()
    : "—"

  // Items might be undefined or partial
  const displayItems = items ?? []

  return (
    <div className="max-w-md p-4 rounded-lg border">
      <h3>{displayTitle}</h3>
      <p className="text-2xl">{displayValue}</p>
      {displayItems.length > 0 ? (
        <ul>
          {displayItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No items yet</p>
      )}
    </div>
  )
}
```

## Smooth Transitions

Use CSS for smooth updates:

```tsx
// Fade in new content
<div className="transition-opacity duration-200">
  {content}
</div>

// Animate list changes
<ul className="space-y-2">
  {items.map((item, i) => (
    <li
      key={item.id}
      className="animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {item.label}
    </li>
  ))}
</ul>

// Smooth height changes
<div className="transition-all duration-200 ease-in-out overflow-hidden">
  {expanded && <ExpandedContent />}
</div>
```

## Error States

Handle errors gracefully:

```tsx
export function DataComponent({ data, error }: Props) {
  if (error) {
    return (
      <div className="max-w-md p-4 rounded-lg border border-red-200 bg-red-50">
        <p className="text-sm text-red-600">
          Failed to load data. {error.message}
        </p>
      </div>
    )
  }

  if (!data) {
    return <DataComponentSkeleton />
  }

  return <ActualContent data={data} />
}
```

## Testing Streaming

Test with partial data:

```tsx
// Test with empty/partial props
render(<MyComponent title={undefined} items={[]} />)

// Test with streaming state
const { result } = renderHook(() =>
  useTamboComponentState("test-key", [])
)

act(() => {
  result.current[1](["item1"])  // Simulate AI update
})

expect(result.current[0]).toEqual(["item1"])
```
