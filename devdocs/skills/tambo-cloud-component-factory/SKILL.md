---
name: tambo-cloud-component-factory
description: >-
  Use this skill when adding a new feature to Tambo Cloud that spans database, tRPC, and UI.
  Covers the full stack: Drizzle schema, DB operations, tRPC router, settings UI with
  interactable wrapping, settings page registration, and tests. Triggers when the user asks
  to "add a new settings section", "build a new feature", "wire up a new route", or any work
  touching apps/web + packages/db end-to-end -- even if they just say "add a toggle" or
  "add a new page" without naming the stack layers explicitly.
  Not for framework SDK work (react-sdk, cli, showcase) -- those follow different patterns.
---

# Tambo Cloud Component Factory

End-to-end guide for adding a new feature to Tambo Cloud. Covers every layer from database to UI so agents produce code that matches existing codebase patterns exactly.

**Real-world example**: See [references/real-implementation.md](references/real-implementation.md) for a complete trace of the skills feature through all 6 layers with actual file paths and code.

**Validation script**: After implementing, run `bash scripts/validate-new-section.sh <feature-name>` to verify all layers are properly wired.

## Gotchas

These are the mistakes agents make most often. Read before writing any code.

1. **Zod imports are `"zod/v3"`, not `"zod"`**. Every file in this codebase uses `import { z } from "zod/v3"`. Using `"zod"` will fail at runtime.
2. **DB operations are a named export**: `import { operations } from "@tambo-ai-cloud/db"`. Never `import * as operations` -- that would nest as `operations.operations.*`.
3. **`EditWithTamboButton` is a local component**, not from `@tambo-ai/react`. Import from `@/components/ui/tambo/edit-with-tambo-button`.
4. **`withTamboInteractable` IS from `@tambo-ai/react`**. Don't confuse the two.
5. **Every Zod prop field needs `.describe()`**. Tambo uses these descriptions to understand component context. Missing descriptions silently degrade AI quality.
6. **DB IDs use `generate_custom_id('prefix_')`**, not `crypto.randomUUID()`. Follow the prefix convention per table (e.g., `p_` for projects, `hk_` for API keys).
7. **Tables use the builder callback pattern**, not imported column helpers. Use `({ text, timestamp, uuid, boolean }) => ({...})`.
8. **Toast `variant: "destructive"` needs `as const`** in some contexts to satisfy TypeScript.
9. **Settings page sidebar nav must be updated in TWO places**: the desktop sidebar and the mobile dropdown menu. Missing one creates a broken nav on that viewport.

## Before Starting

1. Read existing code for a similar feature (skills, OAuth, tool-call-limit) to match patterns
2. Check if the feature depends on other settings being configured first
3. Identify which category this belongs to (Project settings vs Agent config)

## Layer 1: Database Schema (packages/db)

**File:** `packages/db/src/schema.ts`

```typescript
export const myFeature = pgTable(
  "my_feature",
  ({ text, timestamp, uuid, boolean }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('mf_')`),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }),
  (table) => [index("my_feature_project_id_idx").on(table.projectId)],
);
```

Export inferred types below the table: `export type DBMyFeature = typeof myFeature.$inferSelect;`

After schema changes: `npm run db:generate -w packages/db`. Do NOT run `db:migrate` without asking.

## Layer 2: Database Operations (packages/db)

**File:** `packages/db/src/operations/my-feature.ts`

```typescript
import { and, eq } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function listMyFeatures(db: HydraDb, projectId: string) {
  return db
    .select()
    .from(schema.myFeature)
    .where(eq(schema.myFeature.projectId, projectId));
}

export async function createMyFeature(
  db: HydraDb,
  data: { projectId: string; name: string },
) {
  const [result] = await db.insert(schema.myFeature).values(data).returning();
  return result;
}

export async function deleteMyFeature(db: HydraDb, id: string) {
  await db.delete(schema.myFeature).where(eq(schema.myFeature.id, id));
}
```

Export from `packages/db/src/operations/index.ts`: add `export * from "./my-feature";`

## Layer 3: tRPC Router (apps/web)

**File:** `apps/web/server/api/routers/my-feature.ts`

```typescript
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operations } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v3";

export const myFeatureRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      return operations.listMyFeatures(ctx.db, input.projectId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      return operations.createMyFeature(ctx.db, input);
    }),

  delete: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      return operations.deleteMyFeature(ctx.db, input.id);
    }),
});
```

**Register in root router** (`apps/web/server/api/root.ts`):

```typescript
import { myFeatureRouter } from "./routers/my-feature";

export const appRouter = createTRPCRouter({
  // ... existing routers
  myFeature: myFeatureRouter,
});
```

## Layer 4: Settings UI Component (apps/web)

**File:** `apps/web/components/dashboard-components/project-details/my-feature-section.tsx`

Reference implementation: `custom-instructions-editor.tsx` (best example of the full pattern).

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditWithTamboButton } from "@/components/ui/tambo/edit-with-tambo-button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { withTamboInteractable } from "@tambo-ai/react";
import { z } from "zod/v3";

// 1. Define interactable props schema -- EVERY field needs .describe()
export const InteractableMyFeatureSectionProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  onEdited: z
    .function()
    .args()
    .returns(z.void())
    .optional()
    .describe("Callback invoked after feature settings are updated."),
});

type MyFeatureSectionProps = z.infer<typeof InteractableMyFeatureSectionProps>;

// 2. Build the component
export function MyFeatureSection({ projectId, onEdited }: MyFeatureSectionProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  const { data, isLoading } = api.myFeature.list.useQuery({ projectId });

  // Every mutation follows this pattern: invalidate cache, toast, call onEdited
  const createMutation = api.myFeature.create.useMutation({
    onSuccess: async () => {
      await utils.myFeature.list.invalidate();
      toast({ title: "Success", description: "Feature created" });
      onEdited?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create feature",
        variant: "destructive" as const,
      });
    },
  });
  // Repeat pattern for update/delete mutations

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          My Feature
          <EditWithTamboButton description="Configure my feature settings..." />
        </CardTitle>
        <CardDescription className="text-sm font-sans text-foreground">
          Description of what this feature does.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content here -- use Skeleton for loading state */}
      </CardContent>
    </Card>
  );
}

// 3. Wrap with interactable HOC
export const InteractableMyFeatureSection = withTamboInteractable(
  MyFeatureSection,
  {
    componentName: "MyFeature",
    description: "Manages my feature settings for a project...",
    propsSchema: InteractableMyFeatureSectionProps,
  },
);
```

## Layer 5: Register in Settings Page

**File:** `apps/web/components/dashboard-components/project-settings.tsx`

Four changes required:

1. **Import** the `Interactable*` component at the top of the file
2. **Add a ref**: `const myFeatureRef = useRef<HTMLDivElement>(null)`
3. **Add to sidebar nav** -- update BOTH the desktop sidebar (`hidden sm:block` div) AND the mobile dropdown menu (`sm:hidden` div) with a navigation Button
4. **Add the section** in the scrollable content area:

```tsx
<div ref={myFeatureRef} className="p-2">
  <InteractableMyFeatureSection
    projectId={project.id}
    onEdited={handleRefreshProject}
  />
</div>
```

Also add the ref key to the `scrollToSection` refs map and update the `activeSection` state type if needed.

## Layer 6: Tests

**File:** `apps/web/components/dashboard-components/project-details/my-feature-section.test.tsx`

Reference implementation: `tool-call-limit-editor.test.tsx`.

Standard mock setup (verified against codebase):

```typescript
import { MyFeatureSection } from "./my-feature-section";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mock toast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock tRPC
const mockMutateAsync = jest.fn();
jest.mock("@/trpc/react", () => ({
  api: {
    myFeature: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      create: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
    },
    useUtils: () => ({
      myFeature: { list: { invalidate: jest.fn() } },
    }),
  },
}));

// Mock Tambo -- withTamboInteractable as pass-through
jest.mock("@tambo-ai/react", () => ({
  useTamboContextHelpers: () => ({
    addContextHelper: jest.fn(),
    removeContextHelper: jest.fn(),
  }),
  withTamboInteractable: (Component: React.ComponentType) => Component,
  useTamboContextAttachment: () => ({
    attachments: [],
    removeContextAttachment: jest.fn(),
    setCustomSuggestions: jest.fn(),
    addContextAttachment: jest.fn(),
  }),
  useTamboCurrentComponent: () => null,
  useTambo: () => ({
    isIdle: true,
    messages: [],
    isStreaming: false,
  }),
  useTamboThreadInput: () => ({
    value: "",
    setValue: jest.fn(),
    submit: jest.fn(),
  }),
  useTamboInteractable: () => ({
    setInteractableSelected: jest.fn(),
  }),
}));

// Mock EditWithTamboButton
jest.mock("@/components/ui/tambo/edit-with-tambo-button", () => ({
  EditWithTamboButton: () => null,
}));
```

Test the standard states:

```typescript
describe("MyFeatureSection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders empty state when no items exist");
  it("shows skeleton during loading");
  it("renders items when data exists");
  it("calls create mutation on add");
  it("shows confirmation dialog before delete");
  it("calls onEdited after successful mutation");
});
```

The component must be wrapped in `<MessageThreadPanelProvider>` if it uses Tambo interactable features. Check `tool-call-limit-editor.test.tsx` for the exact wrapper pattern.

## Validation Loop

After completing each layer, validate before moving on. Do not batch all validation to the end.

1. **After Layers 1-2 (DB)**: Run `npm run db:generate -w packages/db`, then `npm run check-types` to confirm schema and operations compile.
2. **After Layer 3 (tRPC)**: Run `npm run check-types` again -- router type errors surface immediately.
3. **After Layer 4-5 (UI)**: Run `npm run check-types` and `npm run lint`. Fix any issues before writing tests.
4. **After Layer 6 (Tests)**: Run `npm test`. If tests fail, fix the test or the component, then re-run. Do not proceed with failures.
5. **Final gate**: Run all three together: `npm run check-types && npm run lint && npm test`. Only commit when all pass.
6. **Wiring check**: Run `bash scripts/validate-new-section.sh <feature-name>` to confirm all layers are connected. Fix any FAIL items before committing.

If validation fails at any step, fix the issue and re-validate that step before continuing.

## Checklist

```
- [ ] Database schema added (packages/db/src/schema.ts)
- [ ] Database operations added + exported (packages/db/src/operations/)
- [ ] Migration generated (npm run db:generate -w packages/db)
- [ ] check-types passes after DB layer
- [ ] tRPC router created + registered in root.ts
- [ ] check-types passes after router layer
- [ ] UI component with Card layout + interactable wrapping
- [ ] Zod props schema has .describe() on every field
- [ ] Section registered in project-settings.tsx (ref + BOTH sidebars + content)
- [ ] check-types + lint pass after UI layer
- [ ] Tests written (empty, loading, data, mutation states)
- [ ] npm test passes
- [ ] Final gate: check-types + lint + test all pass
```
