---
name: create-agent-component
description: Create a new generative UI component that AI assistants can render by generating props
argument-hint: {component description}
---

# /create-agent-component {description}

Create a new React component that AI can render by generating props.

## Arguments

`{description}` - What the component should do, e.g., "a weather card showing temperature and conditions"

## Process

### 1. Check Setup

```bash
npm run tambo status --json
```

If not set up, guide through setup first.

### 2. Check Styling System

**AGENT: You must check this before generating component code.**

- Read `package.json` → look for `tailwindcss` in dependencies/devDependencies
- Glob for `tailwind.config.*` in project root

- **Tailwind found** → Generate component with Tailwind classes
- **No Tailwind** → **AGENT:** Generate with Tailwind classes but add comment at top: `// STYLING: Convert Tailwind classes to your CSS system. See references/STYLING-GUIDE.md`. Then offer to help user convert.

### 3. Determine Component Details

From the description, determine:
- **Name:** PascalCase component name (e.g., `WeatherCard`)
- **File:** kebab-case filename (e.g., `weather-card.tsx`)
- **Props:** What data the AI will generate

### 4. Create Component File

Create `src/components/tambo/{file}.tsx`:

```tsx
import { z } from "zod"

// Schema with descriptions for AI
export const {name}Schema = z.object({
  // Add fields based on description
  // Always include .describe() for AI understanding
})

type {Name}Props = z.infer<typeof {name}Schema>

export function {Name}({ ...props }: {Name}Props) {
  return (
    // Implementation
  )
}

// Optional: Loading skeleton for streaming
export function {Name}Skeleton() {
  return (
    <div className="animate-pulse">
      {/* Skeleton UI */}
    </div>
  )
}
```

### 5. Register Component

Add to `src/components/lib/tambo.ts`:

```tsx
import { {Name}, {name}Schema, {Name}Skeleton } from "../tambo/{file}"

// In componentRegistry array:
{
  name: "{Name}",
  description: "Clear description of what this shows and when AI should use it.",
  component: {Name},
  propsSchema: {name}Schema,
  loadingComponent: {Name}Skeleton,
}
```

### 6. Verify

```bash
npm run tambo components installed --json
```

## Schema Guidelines

- **Always use `.describe()`** on every field
- **Use enums** instead of open strings when possible
- **Add `.default()`** for optional fields
- **Keep nesting shallow** - AI generates better with flat schemas

## Example

Input: `/create-agent-component a card showing a stock price with ticker, price, and percent change`

Creates `src/components/tambo/stock-card.tsx`:

```tsx
import { z } from "zod"

export const stockCardSchema = z.object({
  ticker: z.string().describe("Stock ticker symbol, e.g., AAPL"),
  price: z.number().describe("Current stock price in USD"),
  change: z.number().describe("Percent change from previous close"),
  direction: z.enum(["up", "down", "flat"]).describe("Price direction"),
})

type StockCardProps = z.infer<typeof stockCardSchema>

export function StockCard({ ticker, price, change, direction }: StockCardProps) {
  const colors = {
    up: "text-green-600",
    down: "text-red-600",
    flat: "text-gray-600",
  }

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex justify-between items-start">
        <span className="font-mono font-semibold">{ticker}</span>
        <span className={colors[direction]}>
          {change > 0 ? "+" : ""}{change.toFixed(2)}%
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold">
        ${price.toFixed(2)}
      </div>
    </div>
  )
}
```

Registration in tambo.ts:

```tsx
{
  name: "StockCard",
  description: "Displays stock price with ticker and change. Use when user asks about stocks, prices, market data, or financial metrics.",
  component: StockCard,
  propsSchema: stockCardSchema,
}
```
