# Loading States for Analytics Queries

**Internal Development Guide**

## Problem Statement

Analytics and data-heavy queries that take longer than 200ms cause UI flashing issues:

- Dashboard metrics flash "0" before showing actual data
- Users see brief empty states before content loads
- Dropdown controls become unresponsive during data fetching

## Solution Pattern

### 1. Always Extract Loading States

When using tRPC queries that may take >200ms, always extract the `isLoading` state:

```tsx
// ❌ Bad - Only data extraction
const { data: totalUsage } = api.project.getTotalMessageUsage.useQuery(
  { period: messagesPeriod },
  { enabled: !!session },
);

// ✅ Good - Extract both data and loading state
const { data: totalUsage, isLoading: isLoadingMessageUsage } =
  api.project.getTotalMessageUsage.useQuery(
    { period: messagesPeriod },
    { enabled: !!session },
  );
```

### 2. Component Loading State Pattern

Components should accept and handle loading states properly:

```tsx
interface ComponentProps {
  value: number;
  isLoading?: boolean;
}

export function MetricCard({ value, isLoading = false }: ComponentProps) {
  return (
    <div>
      {isLoading ? (
        // Skeleton that matches the expected content size
        <div className="h-16 w-24 bg-muted animate-pulse rounded" />
      ) : (
        <div className="text-6xl">{value.toLocaleString()}</div>
      )}
    </div>
  );
}
```

### 3. Disable Interactive Elements

Prevent user interactions during loading to avoid confusion:

```tsx
<Select
  value={selectedPeriod}
  onValueChange={handlePeriodChange}
  disabled={isLoading} // Disable during loading
>
  <SelectTrigger className="disabled:opacity-50">
    <SelectValue />
  </SelectTrigger>
</Select>
```

## Standard Loading Patterns

Use these consistent patterns across the codebase:

### Dashboard Metrics

```tsx
// Skeleton for large numbers
<div className="h-16 w-24 bg-muted animate-pulse rounded" />
```

### Data Tables

```tsx
// Multiple row skeletons
<div className="space-y-2">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
  ))}
</div>
```

### Charts

```tsx
// Chart area skeleton
<div className="h-64 animate-pulse bg-muted rounded" />
```

### Form Controls

```tsx
// Small control skeleton
<div className="h-8 w-20 animate-pulse rounded bg-muted" />
```

## Implementation Example

The dashboard page demonstrates this pattern:

```tsx
// Extract loading states
const { data: totalUsage, isLoading: isLoadingMessageUsage } =
  api.project.getTotalMessageUsage.useQuery(
    { period: messagesPeriod },
    { enabled: !!session },
  );

// Pass to components
<DashboardCard
  title="Messages"
  value={totalUsage?.totalMessages || 0}
  isLoading={isLoadingMessageUsage}
  onPeriodChange={setMessagesPeriod}
/>;
```

## When to Apply This Pattern

- Any query that involves database aggregations
- Analytics endpoints that process large datasets
- Queries with complex filtering or calculations
- Any query you observe taking >200ms in development

## Testing

Test loading states by:

1. Using Chrome DevTools to throttle network speed
2. Adding artificial delays in development
3. Testing with large datasets

## Key Principle

**Separate "no data" from "loading data":**

- No data = show 0 or empty state
- Loading data = show skeleton/spinner

Never let users see flashing zeros or empty states during legitimate loading periods.
