---
name: tambo-cloud-feature-builder
description: >-
  Use this skill when adding a new feature to Tambo Cloud that spans database, tRPC, and UI.
  Covers the full workflow: deciding where the feature belongs (project vs agent settings),
  checking feature dependencies and provider capabilities, and implementing all 6 stack layers
  (Drizzle schema, DB operations, tRPC router, settings UI with interactable wrapping, settings
  page registration, and tests). Triggers when the user asks to "add a new settings section",
  "build a new feature", "wire up a new route", "add a toggle", "add a new page", or any work
  touching apps/web + packages/db end-to-end. Also triggers on "where should X go?", "provider
  support", "feature gating", "capability check", "agent mode vs LLM mode", "skills supported",
  "adding a new provider", or adding features that depend on other settings.
  Not for framework SDK work (react-sdk, cli, showcase); those follow different patterns.
---

# Tambo Cloud Feature Builder

End-to-end guide for adding a new feature to Tambo Cloud. Covers placement decisions, dependency checks, and every implementation layer from database to UI so agents produce code that matches existing codebase patterns exactly.

**Real-world example**: See [references/real-implementation.md](references/real-implementation.md) for a complete trace of the skills feature through all 6 layers with actual file paths and code.

## Gotchas

These are the mistakes agents make most often. Read before writing any code.

1. **Zod imports are `"zod/v3"`, not `"zod"`**. Every file in this codebase uses `import { z } from "zod/v3"`. Using `"zod"` will fail at runtime.
2. **DB operations are a named export**: `import { operations } from "@tambo-ai-cloud/db"`. Never `import * as operations`; that would nest as `operations.operations.*`.
3. **`EditWithTamboButton` is a local component**, not from `@tambo-ai/react`. Import from `@/components/ui/tambo/edit-with-tambo-button`.
4. **`withTamboInteractable` IS from `@tambo-ai/react`**. Don't confuse the two.
5. **Every Zod prop field needs `.describe()`**. Tambo uses these descriptions to understand component context. Missing descriptions silently degrade AI quality.
6. **DB IDs use `generate_custom_id('prefix_')`**, not `crypto.randomUUID()`. Follow the prefix convention per table (e.g., `p_` for projects, `hk_` for API keys).
7. **Tables use the builder callback pattern**, not imported column helpers. Use `({ text, timestamp, uuid, boolean }) => ({...})`.
8. **Toast `variant: "destructive"`** is the standard pattern for error toasts. Use the string literal directly.
9. **Settings page sidebar nav must be updated in TWO places**: the desktop sidebar and the mobile dropdown menu. Missing one creates a broken nav on that viewport.
10. **Settings subsections are scroll targets, NOT routes**. Do not create a new route under `settings/`. All sections render within `settings/page.tsx`.
11. **Agent and Project sections are grouped**. Do not interleave. Check the current order table before placing a new section.
12. **Do not add a new top-level tab** without explicit team alignment. Current tabs (Overview, Observability, Settings) have been stable.
13. **`EditWithTamboButton` goes inside `CardTitle`**, not as a sibling of `CardHeader`. It must have a `description` prop explaining what the section configures.
14. **Call the `onEdited` callback** after successful mutations when the component accepts one. Some sections (like skills) manage their own invalidation internally; most others (tool-call-limit, oauth) rely on `onEdited` to refresh parent state.
15. **Invalidate the query before toasting** in `onSuccess`. Reversing the order can show a success toast while the UI still displays old data.
16. **Use `DeleteConfirmationDialog`**, never inline `AlertDialog` for destructive confirmations. It handles the state shape (`show`, `title`, `description`, `data`) consistently.
17. **Use `text-destructive` semantic color**, never `text-red-500`. Cancel/discard buttons are NOT destructive.
18. **Skills are silently skipped at runtime when the provider doesn't support them**; this is intentional, not a bug.
19. **LangGraph is in the agent provider registry but marked `isSupported: false`**. The UI shows it as "coming soon" via `getAgentProviderLabel()`, not by hiding the option.
20. **"OpenAI Compatible" providers require a base URL** but don't support skills or custom model selection from a predefined list; they use free-text model IDs instead.
21. **`parallelToolCalls` and `strictJsonSchema` LLM parameters only exist for some providers**. The UI must conditionally render these based on the provider config.
22. **MCP server support and Agent mode are mutually exclusive right now**. When building features that touch both, gate on `isAgentMode` early.

## Before Starting

1. Determine where the feature belongs using the placement decision tree below
2. Check if the feature depends on other settings being configured first
3. Read existing code for a similar feature (skills, OAuth, tool-call-limit) to match patterns

---

## Where Does It Go?

### Navigation Structure

```
Dashboard (/)
  Project List | Create Project

Project (/{projectId})
  Overview Tab         -- stats, daily messages chart, API key status
  Observability Tab    -- thread monitoring, message inspection
  Settings Tab         -- all project and agent configuration
```

### Settings Sections (current order)

| #   | Section             | Category | Component                                        |
| --- | ------------------- | -------- | ------------------------------------------------ |
| 1   | API Keys            | Project  | `project-details/api-key-list.tsx`               |
| 2   | LLM Providers       | Agent    | `project-details/provider-key-section.tsx`       |
| 3   | Custom Instructions | Agent    | `project-details/custom-instructions-editor.tsx` |
| 4   | Skills              | Agent    | `project-details/skills-section.tsx`             |
| 5   | MCP Servers         | Agent    | `project-details/available-mcp-servers.tsx`      |
| 6   | Tool Call Limit     | Agent    | `project-details/tool-call-limit-editor.tsx`     |
| 7   | User Authentication | Project  | `project-details/oauth-settings.tsx`             |

**Container:** `apps/web/components/dashboard-components/project-settings.tsx`

### Placement Decision Tree

1. **Configures AI agent behavior?** (model selection, prompts, tools, memory, context) -> **Agent** category in Settings, grouped with LLM Providers through Tool Call Limit.

2. **Configures project infrastructure?** (API keys, auth, team access, billing, webhooks) -> **Project** category in Settings, grouped with API Keys and User Authentication.

3. **Monitoring or debugging view?** (logs, traces, metrics, errors) -> **Observability** tab.

4. **High-level summary or status?** (health, activity, quick-start) -> **Overview** tab.

5. **Standalone workflow unrelated to a single project?** (account settings, org management) -> New top-level route outside `[projectId]` layout. Discuss with team first.

6. **None of the above?** -> Ask the user. State which categories were considered and why none fit.

### Route Structure

```
apps/web/app/(authed)/(dashboard)/
  page.tsx                    -- Dashboard hub (project list)
  [projectId]/
    layout.tsx                -- Project tabs
    page.tsx                  -- Overview tab
    observability/page.tsx    -- Observability tab
    settings/page.tsx         -- Settings tab
```

- Project-scoped pages go under `[projectId]/`
- Settings subsections are scrollable sections within `settings/page.tsx`, NOT separate routes
- Non-project routes go under `(authed)/` outside `(dashboard)/[projectId]/`

### Verification: Placement

- [ ] Section is in the correct category group (Agent or Project) in the sidebar
- [ ] Both desktop and mobile navigation include the new entry
- [ ] Sidebar click scrolls to the correct section

---

## Feature Dependencies

Maps which Tambo Cloud features depend on others. Check the source files to verify tables are current before acting on them.

### Known Dependencies

| Feature           | Depends On        | Constraint                                               | Gate Location                        |
| ----------------- | ----------------- | -------------------------------------------------------- | ------------------------------------ |
| Skills            | LLM Provider      | OpenAI or Anthropic only                                 | `skills-section.tsx:45`              |
| Skills            | API Key           | User-provided or fallback key must exist                 | `skills.ts:49-53`                    |
| Skills            | LLM Mode          | Not available in Agent mode                              | Implicit (provider must be LLM type) |
| MCP Servers       | LLM Mode          | Disabled in Agent mode                                   | `available-mcp-servers.tsx:98`       |
| Model Selection   | LLM Provider      | Available models determined by provider                  | `llm.config.ts:8-63`                 |
| Custom LLM Params | LLM Provider      | `parallelToolCalls`, `strictJsonSchema` vary by provider | `llm.config.ts`                      |
| Agent URL         | Agent Mode        | Required when `AiProviderType.AGENT` selected            | `agent-settings.tsx`                 |
| Agent Providers   | Provider Registry | LangGraph marked `isSupported: false`                    | `agent-registry.ts:10-24`            |

### Independent Features (no dependencies)

These features work with all providers and modes:

- Tool Call Limit
- Custom Instructions
- OAuth Token Validation
- API Keys

### Provider Capabilities

| Provider          | Skills | MCP Servers | Custom Models | Requires Base URL |
| ----------------- | ------ | ----------- | ------------- | ----------------- |
| OpenAI            | Yes    | Yes         | No            | No                |
| Anthropic         | Yes    | Yes         | No            | No                |
| Gemini            | No     | Yes         | No            | No                |
| Mistral           | No     | Yes         | No            | No                |
| Cerebras          | No     | Yes         | No            | No                |
| OpenAI Compatible | No     | Yes         | Yes (custom)  | Yes               |
| Agent Mode        | No     | No          | N/A           | Yes (agent URL)   |

**Source files (authoritative; verify tables against these before acting):**

- `packages/core/src/llms/llm.config.ts` -- LLM provider configs
- `packages/core/src/agent-registry.ts` -- Agent provider support flags
- `packages/backend/src/services/skills/provider-skill-client.ts` -- Skills provider support (`SKILL_PROVIDERS`)

### UI Patterns for Dependent Features

Never silently hide a feature because its dependency is unmet. Show it in a disabled/informational state. Use one of these three patterns:

1. **Warning alert** -- feature section is visible but limited. Name the dependency and how to resolve it. Disable buttons/toggles in the section.

   ```tsx
   // skills-section.tsx -- provider doesn't support skills
   <Alert variant="warning">
     <AlertTriangle className="h-4 w-4" />
     <AlertDescription>
       Skills are currently supported with OpenAI and Anthropic models. Your
       project uses {providerName}. Switch to a supported model to enable
       skills.
     </AlertDescription>
   </Alert>
   ```

2. **Disabled card** (`opacity-60`) -- entire section is non-functional due to mode.

   ```tsx
   // available-mcp-servers.tsx -- agent mode active
   <Card className="opacity-60">
     <CardContent>
       <p>MCP Servers are disabled while Agent mode is enabled.</p>
     </CardContent>
   </Card>
   ```

3. **"Coming soon" in dropdowns** -- specific options not yet supported. Use `disabled` prop + label suffix.
   ```tsx
   // agent-settings.tsx
   <Combobox
     items={AGENT_PROVIDER_REGISTRY.map((provider) => ({
       value: provider.type,
       label: getAgentProviderLabel(provider.type),
       disabled: !provider.isSupported,
     }))}
   />
   ```

### API-Side Gating

Backend code must also respect feature dependencies. Do not assume the UI prevents invalid requests.

Skills are silently skipped (not errored) when the provider doesn't support them. This is intentional; a project can have skills configured for when the user switches back to a supported provider.

When adding a new feature that depends on provider capabilities:

1. Add the capability check to the provider config (`packages/core/src/llms/llm.config.ts` or similar)
2. Add the UI gate in the component (warning alert + disabled controls)
3. Add the API gate in the service (skip or error based on whether the operation is destructive)
4. Update this skill's dependency table and provider capabilities table

### Adding a New Provider

When adding a new LLM provider:

1. Add config to `packages/core/src/llms/llm.config.ts`
2. Determine which features it supports (skills, MCP, custom models)
3. Update `SKILL_PROVIDERS` in `packages/backend/src/services/skills/provider-skill-client.ts` if it supports skills
4. Update this skill's provider capabilities table
5. Test that UI components correctly show/hide features for the new provider

### Verification: Dependencies

- [ ] Dependency prerequisites show appropriate disabled/warning states
- [ ] New dependencies added to the Known Dependencies table
- [ ] Provider capabilities table updated if adding a new provider

---

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

### Verification: Database (Layers 1-2)

Run `npm run db:generate -w packages/db`, then `npm run check-types` to confirm schema and operations compile.

- [ ] Operations file exists in `packages/db/src/operations/`
- [ ] Operations exported from `packages/db/src/operations/index.ts`

---

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

### Verification: tRPC Router (Layer 3)

Run `npm run check-types` to confirm router type errors surface.

- [ ] Router file exists in `apps/web/server/api/routers/`
- [ ] Router uses `ensureProjectAccess` on every procedure
- [ ] Router imports from `zod/v3`
- [ ] Router registered in `apps/web/server/api/root.ts`

---

## Layer 4: Settings UI Component (apps/web)

**File:** `apps/web/components/dashboard-components/project-details/my-feature-section.tsx`

Reference implementations: `custom-instructions-editor.tsx` (full edit/save pattern), `tool-call-limit-editor.tsx` (simpler).

### Card Layout

Every settings section uses this structure:

```tsx
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
export function MyFeatureSection({
  projectId,
  onEdited,
}: MyFeatureSectionProps) {
  const { toast } = useToast();
  const utils = api.useUtils();

  const { data, isLoading } = api.myFeature.list.useQuery({ projectId });

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

### Toast Notifications

Every mutation shows a toast on both success and error. Import `useToast` from `@/hooks/use-toast`.

```tsx
const mutation = api.someRoute.someMutation.useMutation({
  onSuccess: async () => {
    await utils.someRoute.someQuery.invalidate();
    toast({ title: "Success", description: "Setting updated successfully" });
  },
  onError: () => {
    toast({
      title: "Error",
      description: "Failed to update setting",
      variant: "destructive",
    });
  },
});
```

Never skip the error toast.

### Confirmation Dialogs

All destructive actions require `DeleteConfirmationDialog` from `@/components/dashboard-components/delete-confirmation-dialog`:

```tsx
const [alertState, setAlertState] = useState<{
  show: boolean;
  title: string;
  description: string;
  data?: { id: string };
}>({ show: false, title: "", description: "" });

<DeleteConfirmationDialog
  mode="single"
  alertState={alertState}
  setAlertState={setAlertState}
  onConfirm={handleConfirmDelete}
/>;
```

Title includes the item name (`Delete "${name}"?`). Description warns the action cannot be undone.

**Reference:** `project-details/skills-section.tsx`, `project-details/api-key-list.tsx`

### Destructive Action Styling

```tsx
// Inline delete button
<Button variant="ghost" size="icon"
  className="text-destructive hover:text-destructive hover:bg-destructive/10">
  <Trash2 className="h-4 w-4" />
</Button>

// Confirmation dialog action
<AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white">
```

Use `Trash2` from `lucide-react`. Use `hover:bg-destructive/10` for ghost variant hover.

### Save Behavior

**Default:** Use immediate save for toggles, edit/save/cancel for everything else.

#### Toggles: Immediate Save

```tsx
<Switch
  checked={isEnabled}
  onCheckedChange={(checked) => {
    toggleMutation.mutate({ projectId, settingId, enabled: checked });
  }}
  disabled={isToggling}
  aria-label={`${isEnabled ? "Disable" : "Enable"} ${settingName}`}
/>
```

#### Form Fields: Edit/Save/Cancel

Track `isEditing`, `savedValue`, and `displayValue` state:

- Cancel reverts `displayValue` to `savedValue` and exits edit mode
- Save button disabled during mutation, shows "Saving..."
- `autoFocus` on first input when entering edit mode
- Toggle inside a form batches with the form's save; standalone toggles save immediately

**Reference:** `project-details/custom-instructions-editor.tsx`

### Verification: UI Component (Layer 4)

Run `npm run check-types` and `npm run lint`. Fix any issues before writing tests.

- [ ] `EditWithTamboButton` imported and placed inside `CardTitle`
- [ ] `withTamboInteractable` wrapping the component export
- [ ] `useToast` imported for mutation feedback
- [ ] Error toast uses `variant: "destructive"`
- [ ] Card layout components used (`CardTitle`, `CardHeader`, `CardContent`)
- [ ] Every Zod prop field has `.describe()`
- [ ] Imports from `zod/v3`, not `zod`
- [ ] Dependency handling if applicable (disabled state, warning, link to prerequisite)

---

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

### Verification: Settings Registration (Layer 5)

- [ ] Feature referenced in `project-settings.tsx`
- [ ] Ref created and added to the scrollToSection refs map
- [ ] Desktop sidebar nav includes the section (in `hidden sm:block` div)
- [ ] Mobile menu nav includes the section (in `sm:hidden` div)
- [ ] Section placed in correct category group order

---

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

### Verification: Tests (Layer 6)

Run `npm test`. If tests fail, fix the test or the component, then re-run. Do not proceed with failures.

- [ ] Test file exists alongside the component
- [ ] Test mocks `withTamboInteractable` as pass-through
- [ ] Tests cover: empty state, loading, data display, mutation triggers

---

## Full Validation

Run all checks together before committing: `npm run check-types && npm run lint && npm test`. Only commit when all pass.

### Cross-Layer Wiring Checklist

Verify all layers are connected by checking these patterns exist:

1. **Database**: Operations file exists in `packages/db/src/operations/` and is exported from `index.ts` (grep for the feature name in `operations/index.ts`)
2. **tRPC**: Router file exists in `apps/web/server/api/routers/` and the camelCase router name appears in `apps/web/server/api/root.ts`
3. **UI**: Component in `apps/web/components/dashboard-components/project-details/` uses `withTamboInteractable`
4. **Registration**: Feature name or component name appears in `project-settings.tsx`, with a ref, desktop sidebar entry, and mobile menu entry
5. **Tests**: Test file exists in the same directory as the component, mocking `withTamboInteractable`

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
