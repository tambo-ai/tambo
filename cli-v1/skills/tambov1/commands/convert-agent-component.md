---
name: convert-agent-component
description: Convert an existing React component to be AI-renderable as generative UI
argument-hint: {file path}
---

# /convert-agent-component {file}

Convert an existing React component to work with generative UI.

## Arguments

`{file}` - Path to the component file (e.g., `src/components/dashboard-card.tsx`)

## Process

### 1. Read Existing Component

Read the file to understand:
- Current props interface
- Component structure
- Dependencies

### 2. Create Zod Schema

Convert TypeScript props to Zod schema with descriptions:

**Before (TypeScript interface):**
```tsx
interface DashboardCardProps {
  title: string
  value: number
  trend?: "up" | "down"
  showChart?: boolean
}
```

**After (Zod schema):**
```tsx
import { z } from "zod"

export const dashboardCardSchema = z.object({
  title: z.string().describe("Card title displayed at top"),
  value: z.number().describe("Primary metric value"),
  trend: z.enum(["up", "down"]).optional().describe("Trend direction indicator"),
  showChart: z.boolean().default(false).describe("Whether to show sparkline chart"),
})

type DashboardCardProps = z.infer<typeof dashboardCardSchema>
```

### 3. Update Component

Ensure component:
- Uses derived type from schema
- Has sensible defaults
- Handles partial/missing data gracefully
- Scales well in chat context

### 4. Add Loading Skeleton

```tsx
export function DashboardCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border animate-pulse">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-8 w-16 bg-muted rounded mt-2" />
    </div>
  )
}
```

### 5. Move to Tambo Directory

Move from current location to `src/components/tambo/`:

```bash
# Moved from:
src/components/dashboard-card.tsx

# To:
src/components/tambo/dashboard-card.tsx
```

### 6. Register in tambo.ts

```tsx
import { DashboardCard, dashboardCardSchema, DashboardCardSkeleton } from "../tambo/dashboard-card"

// Add to componentRegistry:
{
  name: "DashboardCard",
  description: "Shows a metric card with optional trend and chart. Use for KPIs, statistics, dashboard widgets.",
  component: DashboardCard,
  propsSchema: dashboardCardSchema,
  loadingComponent: DashboardCardSkeleton,
}
```

### 7. Update Imports

Find and update all imports of the moved component:

```tsx
// Before
import { DashboardCard } from "@/components/dashboard-card"

// After
import { DashboardCard } from "@/components/tambo/dashboard-card"
```

### 8. Review

Run `/review-agent-component src/components/tambo/dashboard-card.tsx` to validate.

## Conversion Checklist

See `references/CONVERSION-CHECKLIST.md` for detailed checklist.

Quick checks:
- [ ] Zod schema with `.describe()` on all fields
- [ ] Types derived from schema
- [ ] Defaults for optional props
- [ ] Handles partial state (for streaming)
- [ ] Max-width constraint for chat context
- [ ] Loading skeleton
- [ ] Registered with clear description
- [ ] Old imports updated

## Common Issues

### Complex nested props
Flatten where possible. AI generates better with shallow schemas.

### External dependencies
Keep dependencies minimal. If component needs heavy libs, consider lazy loading.

### Fixed dimensions
Use responsive sizing. Component should work at various widths.

### Missing error states
Add fallbacks for undefined/null values.
