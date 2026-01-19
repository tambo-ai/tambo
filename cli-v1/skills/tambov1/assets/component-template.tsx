/**
 * Generative UI Component Template
 *
 * Copy to src/components/tambo/<your-component>.tsx
 * Register in src/components/lib/tambo.ts
 *
 * Uses @tambo-ai/react for streaming state (optional)
 *
 * STYLING: Uses Tailwind CSS by default (recommended).
 * If using a different CSS system, replace className values.
 * See references/STYLING-GUIDE.md for conversion patterns.
 */

import { z } from "zod";
// Uncomment for AI-updateable state:
// import { useTamboComponentState } from "@tambo-ai/react"

// =============================================================================
// SCHEMA
// =============================================================================
// Define props AI will generate. Always add .describe() for AI understanding.

export const myComponentSchema = z.object({
  // Required fields
  title: z.string().describe("Main heading for the component"),

  // Optional with defaults
  variant: z
    .enum(["default", "outline", "ghost"])
    .default("default")
    .describe("Visual style variant"),

  // Arrays
  items: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.number().optional(),
      }),
    )
    .describe("List of items to display"),

  // Optional fields
  subtitle: z.string().optional().describe("Secondary text below title"),
  showBorder: z.boolean().default(true).describe("Whether to show border"),
});

// =============================================================================
// TYPE
// =============================================================================

type MyComponentProps = z.infer<typeof myComponentSchema>;

// =============================================================================
// COMPONENT
// =============================================================================

export function MyComponent({
  title,
  variant = "default",
  items,
  subtitle,
  showBorder = true,
}: MyComponentProps) {
  const variantStyles = {
    default: "bg-card",
    outline: "bg-transparent border-2",
    ghost: "bg-transparent",
  };

  return (
    <div
      className={`
        max-w-md rounded-lg p-4
        ${variantStyles[variant]}
        ${showBorder ? "border" : ""}
      `}
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold">{title ?? "Loading..."}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Content - handle partial/empty data */}
      {items?.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-1"
            >
              <span>{item.label}</span>
              {item.value !== undefined && (
                <span className="font-mono text-sm text-muted-foreground">
                  {item.value}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-muted-foreground">No items</p>
      )}
    </div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

export function MyComponentSkeleton() {
  return (
    <div className="max-w-md animate-pulse rounded-lg border p-4">
      <div className="mb-3">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="mt-1 h-3 w-48 rounded bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
      </div>
    </div>
  );
}

// =============================================================================
// REGISTRATION (add to tambo.ts)
// =============================================================================
/*

import {
  MyComponent,
  myComponentSchema,
  MyComponentSkeleton,
} from "../tambo/my-component"

// Add to componentRegistry array:
{
  name: "MyComponent",
  description: "Displays a titled list of items with optional values. Use when showing lists, menus, or collections of labeled items.",
  component: MyComponent,
  propsSchema: myComponentSchema,
  loadingComponent: MyComponentSkeleton,
}

*/

// =============================================================================
// STREAMING STATE VARIANT (for AI-updateable components)
// =============================================================================
/*

import { useTamboComponentState } from "@tambo-ai/react"

export const streamingListSchema = z.object({
  title: z.string().describe("List title"),
  initialItems: z.array(z.string()).describe("Initial list items"),
})

type StreamingListProps = z.infer<typeof streamingListSchema>

export function StreamingList({ title, initialItems }: StreamingListProps) {
  // AI can update this state after initial render
  const [items, setItems, { isPending }] = useTamboComponentState(
    "streaming-list-items", // MUST be unique
    initialItems
  )

  return (
    <div className="max-w-md rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {isPending && (
          <span className="animate-pulse text-xs text-muted-foreground">
            Updating...
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex justify-between text-sm">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

*/
