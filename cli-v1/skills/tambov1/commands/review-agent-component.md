---
name: review-agent-component
description: Review a component for generative UI best practices - scaling, schema, streaming, accessibility
argument-hint: {file path}
---

# /review-agent-component {file}

Review a component to ensure it follows generative UI best practices.

## Arguments

`{file}` - Path to the component file (e.g., `src/components/tambo/data-card.tsx`)

## Review Checklist

### 1. Scaling (Chat Context)

Components render inside chat messages. Verify:

- [ ] **Max-width constraint** - Won't stretch full viewport
  ```tsx
  // Good
  <div className="max-w-md">

  // Bad - no width constraint
  <div className="w-full">
  ```

- [ ] **Responsive at small sizes** - Works at 300px width
- [ ] **No fixed heights** that break with variable content
- [ ] **Text truncation** for long content
  ```tsx
  <p className="truncate">
  ```

- [ ] **Scrollable areas** have max-height
  ```tsx
  <div className="max-h-64 overflow-auto">
  ```

### 2. Schema Design

- [ ] **Zod schema exists** with exported name
  ```tsx
  export const myComponentSchema = z.object({...})
  ```

- [ ] **`.describe()` on ALL fields** - AI needs this
  ```tsx
  // Good
  title: z.string().describe("Main heading text")

  // Bad
  title: z.string()
  ```

- [ ] **Proper defaults** for optional fields
  ```tsx
  showIcon: z.boolean().default(true).describe("...")
  ```

- [ ] **Enums over strings** where possible
  ```tsx
  // Good
  status: z.enum(["active", "pending", "done"])

  // Avoid
  status: z.string()
  ```

- [ ] **Shallow nesting** - Max 2 levels deep
- [ ] **Types derived from schema**
  ```tsx
  type Props = z.infer<typeof myComponentSchema>
  ```

### 3. Streaming Support

For components with `useTamboComponentState`:

- [ ] **Unique key** for state
  ```tsx
  const [data, setData] = useTamboComponentState("unique-key", initial)
  ```

- [ ] **Loading indicator** when `isPending`
  ```tsx
  const [data, setData, { isPending }] = useTamboComponentState(...)
  {isPending && <Spinner />}
  ```

- [ ] **Handles partial data** - Won't crash if fields missing during stream

For all components:

- [ ] **Loading skeleton exists**
  ```tsx
  export function MyComponentSkeleton() {...}
  ```

- [ ] **Skeleton registered**
  ```tsx
  { loadingComponent: MyComponentSkeleton }
  ```

### 4. Accessibility

- [ ] **Semantic HTML** - Uses proper elements
  ```tsx
  // Good
  <button>, <nav>, <article>, <main>

  // Avoid
  <div onClick={...}>
  ```

- [ ] **ARIA labels** for icon buttons
  ```tsx
  <button aria-label="Close dialog">
    <XIcon />
  </button>
  ```

- [ ] **Keyboard navigation** works
- [ ] **Color contrast** meets WCAG AA
- [ ] **Focus indicators** visible

### 5. Error Handling

- [ ] **Handles undefined props** gracefully
  ```tsx
  // Good
  {items?.map(...)}

  // Bad - crashes if undefined
  {items.map(...)}
  ```

- [ ] **Empty states** for no data
  ```tsx
  {items.length === 0 && <EmptyState />}
  ```

- [ ] **Fallback values** for display
  ```tsx
  {title || "Untitled"}
  ```

### 6. Registration

- [ ] **Registered in tambo.ts**
- [ ] **Description has trigger words**
  ```tsx
  // Good
  description: "Shows weather for a location. Use when user asks about weather, forecast, temperature."

  // Bad
  description: "A weather component."
  ```

- [ ] **Description matches behavior**

## Output Format

After review, report:

```
## Review: {ComponentName}

### Passing
- [x] Check 1
- [x] Check 2

### Issues Found
- [ ] Issue description
  - Location: line X
  - Fix: suggested fix

### Recommendations
- Optional improvements
```

## Auto-Fix Suggestions

For common issues, suggest fixes:

**Missing descriptions:**
```tsx
// Add .describe() to these fields:
title: z.string().describe("...")
```

**No max-width:**
```tsx
// Wrap in constrained container:
<div className="max-w-md">
  {/* existing content */}
</div>
```

**No loading skeleton:**
```tsx
// Add skeleton component:
export function MyComponentSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Match structure of real component */}
    </div>
  )
}
```
