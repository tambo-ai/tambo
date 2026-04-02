# Real Implementation: Skills Feature

This traces the skills feature through all 6 layers of the Tambo Cloud stack. Use as a reference when building a new feature -- follow the same patterns.

## Layer 1: Database Schema

**File:** `packages/db/src/schema.ts` (lines 1192-1226)

```typescript
export const skills = pgTable(
  "skills",
  ({ text, timestamp, boolean, integer, uuid }) => ({
    id: text("id")
      .primaryKey()
      .notNull()
      .unique()
      .default(sql`generate_custom_id('sk_')`),
    projectId: text("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    instructions: text("instructions").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    usageCount: integer("usage_count").notNull().default(0),
    externalSkillMetadata: customJsonb<ExternalSkillMetadata>(
      "external_skill_metadata",
    )
      .notNull()
      .default({}),
    createdByUserId: uuid("created_by_user_id").references(() => authUsers.id),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (table) => [
    index("skills_project_id_idx").on(table.projectId),
    unique("skills_project_id_name_idx").on(table.projectId, table.name),
  ],
);

export type DBSkill = typeof skills.$inferSelect;
```

Patterns to note:

- ID prefix `sk_` via `generate_custom_id`
- Unique constraint on `(projectId, name)` pair
- JSONB column for extensible metadata
- Inferred type export at the bottom

## Layer 2: Database Operations

**File:** `packages/db/src/operations/skills.ts`

Key function signatures:

```typescript
export async function createSkill(db: HydraDb, {...}) => Promise<DBSkill>
export async function getSkill(db: HydraDb, projectId, skillId) => Promise<DBSkill | undefined>
export async function listSkillsForProject(db: HydraDb, projectId, options?) => Promise<DBSkill[]>
export async function updateSkill(db: HydraDb, {...}) => Promise<DBSkill | undefined>
export async function deleteSkill(db: HydraDb, projectId, skillId) => Promise<void>
```

Custom error class for domain-specific constraints:

```typescript
export class SkillNameConflictError extends Error {
  constructor(name: string) {
    super(`A skill named "${name}" already exists in this project`);
    this.name = "SkillNameConflictError";
  }
}
```

Exported from `packages/db/src/operations/index.ts` via `export * from "./skills";`

## Layer 3: tRPC Router

**File:** `apps/web/server/api/routers/skills.ts`

```typescript
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operations, schema, SkillNameConflictError } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v3";

export const skillsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      return operations.listSkillsForProject(ctx.db, input.projectId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z
          .string()
          .min(1)
          .max(SKILL_NAME_MAX_LENGTH)
          .regex(SKILL_NAME_PATTERN, "Name must be kebab-case"),
        description: z.string().min(1).max(SKILL_DESCRIPTION_MAX_LENGTH),
        instructions: z.string().min(1).max(SKILL_INSTRUCTIONS_MAX_LENGTH),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      // ... create skill, upload to provider
    }),

  // update and delete follow the same ensureProjectAccess pattern
});
```

Registered in root: `apps/web/server/api/root.ts` line 35: `skills: skillsRouter`

## Layer 4: UI Component

**File:** `apps/web/components/dashboard-components/project-details/skills-section.tsx`

Interactable props schema (every field has `.describe()`):

```typescript
const InteractableSkillsSectionProps = z.object({
  projectId: z.string().describe("The unique identifier for the project."),
  defaultLlmProviderName: z
    .string()
    .optional()
    .describe("The default LLM provider name for the project."),
  defaultNewSkill: z
    .object({
      name: z.string().describe("The name of the skill to create."),
      description: z.string().describe("The description of the skill."),
      instructions: z.string().describe("The instructions for the skill."),
    })
    .optional()
    .describe("Pre-filled values for creating a new skill."),
});
```

EditWithTamboButton placement (line 390):

```typescript
<EditWithTamboButton description="Manage skills for this project." />
```

Interactable wrapping (lines 542-569):

```typescript
export const InteractableSkillsSection = withTamboInteractable(SkillsSection, {
  componentName: "Skills",
  description: "A component that allows users to manage agent skills...",
  propsSchema: InteractableSkillsSectionProps,
});
```

## Layer 5: Settings Page Registration

**File:** `apps/web/components/dashboard-components/project-settings.tsx`

Four integration points:

```typescript
// 1. Import (line 12)
import { InteractableSkillsSection } from "@/components/dashboard-components/project-details/skills-section";

// 2. Ref (line 60)
const skillsRef = useRef<HTMLDivElement>(null);

// 3a. Desktop sidebar (line 434)
<Button variant="ghost"
  className={`justify-start gap-2 rounded-full text-sm ${
    activeSection === "skills" ? "bg-accent" : "hover:bg-accent"
  }`}
  onClick={() => scrollToSection("skills")}
>
  Skills
</Button>

// 3b. Mobile menu (line 340) -- same button pattern with setIsMobileMenuOpen(false)

// 4. Content area (line 508)
<div ref={skillsRef} className="p-2">
  <InteractableSkillsSection
    projectId={project.id}
    defaultLlmProviderName={project.defaultLlmProviderName ?? undefined}
  />
</div>
```

Also added to the `scrollToSection` refs map (line 154): `skills: skillsRef`

## Layer 6: Tests

**File:** `apps/web/components/dashboard-components/project-details/skills-section.test.tsx`

Mock setup (lines 6-94):

```typescript
// Tambo pass-through
jest.mock("@tambo-ai/react", () => ({
  withTamboInteractable: (Component: React.ComponentType) => Component,
}));

// tRPC with all four procedures
jest.mock("@/trpc/react", () => ({
  api: {
    skills: {
      list: {
        useQuery: () => ({ data: mockSkillsData, isLoading: mockIsLoading }),
      },
      create: {
        useMutation: (opts) => ({
          mutate: (...args) => {
            mockMutate("create", ...args);
            opts.onSuccess?.();
          },
          isPending: false,
        }),
      },
      update: {
        useMutation: (_opts) => ({
          mutate: (...args) => {
            mockMutate("update", ...args);
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
    useUtils: () => ({ skills: { list: { invalidate: mockInvalidate } } }),
  },
}));

// Toast and form utilities
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));
```

Test suites cover: empty state, loading skeleton, error state, create/import/edit/delete, drag-drop validation.
