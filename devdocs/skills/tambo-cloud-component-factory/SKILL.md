---
name: tambo-cloud-component-factory
description: End-to-end guide for adding a new feature to Tambo Cloud. Covers tRPC routes, database operations, settings UI components, interactable wrapping, and tests. Use when the user asks to build a new feature for the Tambo Cloud dashboard.
metadata:
  internal: true
---

# Tambo Cloud Component Factory

Step-by-step guide for adding a new feature to Tambo Cloud. Covers every layer from database to UI so agents get it right without tribal knowledge.

## When to Use This Skill

- User asks to add a new feature to Tambo Cloud (apps/web + apps/api)
- User asks to add a new settings section
- User asks to build a new dashboard page or widget
- Any work that spans backend, tRPC, and frontend in the Tambo Cloud platform

## Before Starting

1. **Determine placement** using the `settings-feature-placement` skill -- where does this feature belong?
2. **Check for dependencies** -- does this feature depend on other settings being configured?
3. **Read the existing code** for a similar feature (skills, OAuth, tool call limit) to match patterns

## Layer 1: Database (packages/db)

Add the schema and operations for the new feature.

**Schema** (`packages/db/src/schema.ts`):

```typescript
export const myFeature = pgTable("my_feature", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**Operations** (`packages/db/src/operations/`):

```typescript
export async function listMyFeatures(db: HydraDb, projectId: string) {
  return db.select().from(myFeature).where(eq(myFeature.projectId, projectId));
}

export async function createMyFeature(db: HydraDb, data: NewMyFeature) {
  const [result] = await db.insert(myFeature).values(data).returning();
  return result;
}
```

- Export new operations from `packages/db/src/operations/index.ts`
- Generate migration: `npm run db:generate -w packages/db`
- Do NOT run `npm run db:migrate` without asking the user

## Layer 2: tRPC Router (apps/web)

Create a router with standard CRUD procedures.

**Router file** (`apps/web/server/api/routers/my-feature.ts`):

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import * as operations from "@tambo-ai-cloud/db";

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

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        id: z.string(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      return operations.updateMyFeature(ctx.db, input.id, input);
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

**Rules:**

- Always call `ensureProjectAccess` before any operation
- Use `protectedProcedure` (never `publicProcedure`) for project-scoped routes
- Validate all inputs with Zod schemas
- Throw `TRPCError` for validation failures

## Layer 3: Settings UI Component (apps/web)

Create the component following `settings-component-patterns` and `accessibility-checklist` skills.

**Main section component** (`apps/web/components/dashboard-components/project-details/my-feature-section.tsx`):

```typescript
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EditWithTamboButton } from "@tambo-ai/react";
import { withTamboInteractable } from "@tambo-ai/react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

// 1. Define interactable props schema
export const InteractableMyFeatureSectionProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  onEdited: z.function().args().returns(z.void()).optional()
    .describe("Callback when feature settings are updated."),
});

type MyFeatureSectionProps = z.infer<typeof InteractableMyFeatureSectionProps>;

// 2. Build the component
export function MyFeatureSection({ projectId, onEdited }: MyFeatureSectionProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  // Query
  const { data, isLoading } = api.myFeature.list.useQuery({ projectId });

  // Mutations with toast pattern
  const createMutation = api.myFeature.create.useMutation({
    onSuccess: async () => {
      await utils.myFeature.list.invalidate();
      toast({ title: "Success", description: "Feature created successfully" });
      onEdited?.();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create feature", variant: "destructive" });
    },
  });

  const deleteMutation = api.myFeature.delete.useMutation({
    onSuccess: async () => {
      await utils.myFeature.list.invalidate();
      toast({ title: "Success", description: "Feature deleted successfully" });
      onEdited?.();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete feature", variant: "destructive" });
    },
  });

  // 3. Confirmation dialog for deletes (see settings-component-patterns skill)

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
        {/* Content here */}
      </CardContent>
    </Card>
  );
}

// 3. Wrap with interactable HOC
export const InteractableMyFeatureSection = withTamboInteractable(MyFeatureSection, {
  componentName: "MyFeature",
  description: "Manages my feature settings for a project...",
  propsSchema: InteractableMyFeatureSectionProps,
});
```

## Layer 4: Register in Settings Page

**File:** `apps/web/components/dashboard-components/project-settings.tsx`

1. Add a ref: `const myFeatureRef = useRef<HTMLDivElement>(null)`
2. Add to sidebar navigation (both desktop `sidebarContent` and mobile `mobileMenuContent`)
3. Add the section div in the content area, adjacent to other sections in the same category (Agent or Project)
4. Pass `projectId` and `onEdited` callback

## Layer 5: Tests

**File:** `apps/web/components/dashboard-components/project-details/my-feature-section.test.tsx`

**Standard mocking pattern:**

```typescript
// Mock Tambo interactable HOC as pass-through
jest.mock("@tambo-ai/react", () => ({
  withTamboInteractable: (Component: React.ComponentType) => Component,
}));

// Mock EditWithTamboButton
jest.mock("@/components/ui/tambo/edit-with-tambo-button", () => ({
  EditWithTamboButton: () => null,
}));

// Mock tRPC
jest.mock("@/trpc/react", () => ({
  api: {
    myFeature: {
      list: { useQuery: () => ({ data: mockData, isLoading: false }) },
      create: {
        useMutation: (opts) => ({
          mutate: (...args) => {
            mockMutate("create", ...args);
            opts.onSuccess?.();
          },
          isPending: false,
        }),
      },
      delete: {
        useMutation: (opts) => ({
          mutateAsync: async (...args) => {
            mockMutateAsync(...args);
            opts.onSuccess?.();
          },
          isPending: false,
        }),
      },
    },
    useUtils: () => ({ myFeature: { list: { invalidate: mockInvalidate } } }),
  },
}));

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));
```

**Test the standard states:**

```typescript
describe("MyFeatureSection", () => {
  it("shows empty state when there are no items", () => {
    /* ... */
  });
  it("shows skeleton when loading", () => {
    /* ... */
  });
  it("renders items when data exists", () => {
    /* ... */
  });
  it("calls create mutation on add", () => {
    /* ... */
  });
  it("shows confirmation dialog before delete", () => {
    /* ... */
  });
  it("calls onEdited after successful mutation", () => {
    /* ... */
  });
});
```

## Layer 6: CLI Command (Optional)

Only add a CLI command if the feature needs to be configurable from the terminal. Most settings features do NOT need CLI support.

**When to add CLI support:**

- The feature is frequently configured during project setup
- The feature involves file-based configuration (like skills with markdown files)
- The user explicitly requests CLI support

**Pattern:** See `cli/src/commands/` for examples. Add handler file, register in `cli/src/cli.ts`.

## Checklist

Copy this and track progress:

```
Feature Addition Progress:
- [ ] Database schema added (packages/db/src/schema.ts)
- [ ] Database operations added (packages/db/src/operations/)
- [ ] Migration generated (npm run db:generate -w packages/db)
- [ ] tRPC router created (apps/web/server/api/routers/)
- [ ] Router registered in root.ts
- [ ] UI component created with Card layout
- [ ] Interactable props schema defined (Zod)
- [ ] Component wrapped with withTamboInteractable
- [ ] Section registered in project-settings.tsx (ref + sidebar + content)
- [ ] Toast notifications on success and error
- [ ] Confirmation dialog for destructive actions
- [ ] Tests written (empty, loading, data, mutation states)
- [ ] Accessibility verified (aria-labels, semantic HTML)
- [ ] npm run check-types passes
- [ ] npm run lint passes
- [ ] npm test passes
```
