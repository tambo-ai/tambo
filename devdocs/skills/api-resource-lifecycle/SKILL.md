---
name: api-resource-lifecycle
description: Guides CRUD operations for API resources with cascading dependencies, descriptive validation, and orphan prevention. Use when adding delete/remove operations, creating validation logic, or building resources that depend on other resources.
metadata:
  internal: true
---

# API Resource Lifecycle

Patterns for building reliable CRUD operations in Tambo Cloud. Covers cascading deletes, descriptive validation errors, duplicate detection, and orphan prevention.

## When to Use This Skill

- Adding delete/remove operations for API resources
- Building resources that depend on other resources (e.g., skills depend on LLM provider)
- Writing validation logic for user input
- Handling resource creation that syncs to external APIs

## Cascading Deletes

When a resource has dependents, deletion must clean up the entire dependency chain.

### Database-level cascades

Use `onDelete: "cascade"` in the schema for simple parent-child relationships where the child has no meaning without the parent:

```typescript
// packages/db/src/schema.ts
export const skills = pgTable("skills", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  // ...
});
```

When the project is deleted, all its skills are automatically removed.

### Manual cascades in transactions

When deletion requires cleanup beyond simple FK cascades (clearing metadata, syncing to external APIs, cleaning up cross-references), use a database transaction:

```typescript
// packages/db/src/operations/project.ts
export async function deleteProject(db: HydraDb, id: string): Promise<boolean> {
  return await db.transaction(async (tx) => {
    await tx
      .delete(schema.providerKeys)
      .where(eq(schema.providerKeys.projectId, id));
    await tx.delete(schema.apiKeys).where(eq(schema.apiKeys.projectId, id));
    await tx
      .delete(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, id));
    const deleted = await tx
      .delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .returning();
    return deleted.length > 0;
  });
}
```

**Reference:** `packages/db/src/operations/project.ts` lines 255-278

### Metadata cleanup on replacement

When a resource is replaced (not deleted), clear dependent metadata so dependents re-sync under the new resource:

```typescript
// apps/web/server/api/routers/project.ts - addProviderKey
// When replacing a provider key, clear skill metadata for that provider
const skills = await operations.listSkillsForProject(ctx.db, projectId);
await Promise.all(
  skills
    .filter((s) => s.externalSkillMetadata?.[providerName])
    .map(async (s) => {
      const { [providerName]: _, ...remaining } = s.externalSkillMetadata ?? {};
      return operations.updateSkill(ctx.db, {
        projectId,
        skillId: s.id,
        externalSkillMetadata: remaining,
      });
    }),
);
```

**Reference:** `apps/web/server/api/routers/project.ts` lines 863-880

### Rules

- If a child record has no meaning without its parent, use `onDelete: "cascade"` in the schema
- If deletion requires multi-step cleanup or external API calls, wrap in a transaction
- When replacing a resource, clear dependent metadata so dependents re-sync
- Always delete children before the parent in manual cascades
- Check for affected dependents and document the cascade chain in code comments

## Descriptive Validation Errors

Every validation error must tell the user what went wrong AND what to do instead.

### Zod schema validation

```typescript
// Good: descriptive message with example
name: z
  .string()
  .min(1, "Name is required")
  .max(64)
  .regex(
    SKILL_NAME_PATTERN,
    "Name must be kebab-case (e.g. scheduling-assistant)",
  ),

// Good: explains the constraint
url: z
  .string()
  .url()
  .refine(
    validateServerUrl,
    "URL appears to be unsafe: must not point to internal, local, or private networks",
  ),

// Bad: generic message
name: z.string().min(1), // Just says "String must contain at least 1 character(s)"
```

**Reference:** `apps/web/server/api/routers/skills.ts` lines 154-171

### TRPCError messages

```typescript
// Good: includes the specific value that caused the conflict
throw new TRPCError({
  code: "BAD_REQUEST",
  message: `Server key "${serverKey}" is already in use by another MCP server in this project`,
});

// Good: explains what was expected
throw new TRPCError({
  code: "BAD_REQUEST",
  message:
    "Max input tokens must be greater than 0 and less than the model's max.",
});

// Bad: vague
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid input",
});
```

### Error code mapping

| Situation               | tRPC Code               | When to use                           |
| ----------------------- | ----------------------- | ------------------------------------- |
| Resource not found      | `NOT_FOUND`             | ID lookup returned null               |
| Input validation failed | `BAD_REQUEST`           | Zod schema or business rule violation |
| Duplicate resource      | `CONFLICT`              | Name/key already exists               |
| Unexpected failure      | `INTERNAL_SERVER_ERROR` | Catch-all for unhandled errors        |

**Consistency note:** Use `CONFLICT` for duplicate name errors, not `BAD_REQUEST`. The codebase has some inconsistency here -- skills use `CONFLICT`, MCP servers use `BAD_REQUEST` for the same pattern. Prefer `CONFLICT`.

## Duplicate Detection

Check for existing resources before creation. Return a clear error if a duplicate exists.

### Custom exception classes

For database-level unique constraints, map PostgreSQL violation codes to domain-specific exceptions:

```typescript
// packages/db/src/operations/skills.ts
const PG_UNIQUE_VIOLATION = "23505";
const SKILLS_NAME_UNIQUE_CONSTRAINT = "skills_project_id_name_idx";

export class SkillNameConflictError extends Error {
  constructor(name: string) {
    super(`A skill named "${name}" already exists in this project`);
    this.name = "SkillNameConflictError";
  }
}

export async function createSkill(
  db: HydraDb,
  data: NewSkill,
): Promise<DBSkill> {
  try {
    const [skill] = await db.insert(schema.skills).values(data).returning();
    return skill;
  } catch (error) {
    if (isSkillNameConflict(error)) {
      throw new SkillNameConflictError(data.name);
    }
    throw error;
  }
}
```

**Reference:** `packages/db/src/operations/skills.ts` lines 44-89

### Pre-creation queries

For resources without unique DB constraints, query before inserting:

```typescript
const existingKeys = await getExistingServerKeys(ctx.db, projectId);
if (existingKeys.includes(serverKey)) {
  throw new TRPCError({
    code: "CONFLICT",
    message: `Server key "${serverKey}" is already in use by another MCP server in this project`,
  });
}
```

**Reference:** `apps/web/server/api/routers/tools.ts` lines 119-126

## Orphan Prevention

When creating a resource that syncs to an external API, roll back on failure:

```typescript
// apps/web/server/api/routers/skills.ts
// Create in DB first, then sync to provider
const skill = await operations.createSkill(ctx.db, { ... });

// If provider sync fails, delete the DB record
try {
  await createSkillOnProviderAndPersist(ctx.db, input.projectId, skill);
} catch (error) {
  await operations.deleteSkill(ctx.db, input.projectId, skill.id);
  throw error;
}
```

**Rules:**

- Create the DB record first (gives you an ID for the external API call)
- If the external sync fails, delete the DB record to avoid orphans
- The user sees an error and can retry, rather than seeing a broken record
- For batch operations, use `Promise.allSettled` and clean up partial failures

**Reference:** `apps/web/server/api/routers/skills.ts` lines 195-204

## Checklist

When building a new CRUD operation:

```
Resource Lifecycle Checklist:
- [ ] Delete cascades documented (which dependents are affected?)
- [ ] Database-level cascades set up for simple parent-child FK relationships
- [ ] Manual cascade logic wrapped in a transaction for complex cleanup
- [ ] All Zod validation messages are descriptive with examples
- [ ] TRPCError messages include the specific value that caused the error
- [ ] Duplicate detection before creation (custom exception or pre-query)
- [ ] Error codes are correct (CONFLICT for duplicates, NOT_FOUND for missing)
- [ ] External API sync failures roll back the DB record
- [ ] Resource replacement clears dependent metadata
```
