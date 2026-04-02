---
name: api-resource-lifecycle
description: Guides CRUD operations for API resources with cascading dependencies, descriptive validation, and orphan prevention. Use when adding delete/remove operations, creating validation logic, building resources that depend on other resources, or when the user mentions "cascade delete", "orphan records", "duplicate detection", "validation errors", "resource cleanup", or "rollback on failure".
metadata:
  internal: true
---

# API Resource Lifecycle

Patterns for building reliable CRUD operations in Tambo Cloud.

## Gotchas

- The codebase uses `CONFLICT` for duplicate name errors in skills but `BAD_REQUEST` for the same pattern in MCP servers. Always use `CONFLICT` for duplicates.
- PostgreSQL unique violation code is `23505`. Catch it and map to a domain-specific exception rather than letting the raw DB error propagate.
- When replacing a provider key, all skills with `externalSkillMetadata` for that provider must have their metadata cleared, or they'll reference a stale key.
- Skills are silently skipped (not errored) at runtime when the provider doesn't support them. This is intentional -- don't add validation that blocks skill creation for unsupported providers.
- `Promise.allSettled` (not `Promise.all`) for batch external API calls -- partial failures need cleanup, not an all-or-nothing abort.

## Cascading Deletes

Default to `onDelete: "cascade"` in the schema. Only use manual transaction cascades when deletion requires external API calls, metadata cleanup, or cross-reference logic.

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

### Manual cascades in transactions

When deletion requires cleanup beyond FK cascades (external APIs, metadata, cross-references), wrap in a transaction:

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

## Validation Errors

Every error must say what went wrong and what to do instead. Include the specific value that failed and an example of what's valid.

```typescript
// Zod: include format example
name: z.string().min(1, "Name is required").max(64)
  .regex(SKILL_NAME_PATTERN, "Name must be kebab-case (e.g. scheduling-assistant)"),

// tRPC: include the conflicting value
throw new TRPCError({
  code: "CONFLICT",
  message: `Server key "${serverKey}" is already in use by another MCP server in this project`,
});
```

### Error code mapping

| Situation               | tRPC Code               | When to use                           |
| ----------------------- | ----------------------- | ------------------------------------- |
| Resource not found      | `NOT_FOUND`             | ID lookup returned null               |
| Input validation failed | `BAD_REQUEST`           | Zod schema or business rule violation |
| Duplicate resource      | `CONFLICT`              | Name/key already exists               |
| Unexpected failure      | `INTERNAL_SERVER_ERROR` | Catch-all for unhandled errors        |

## Duplicate Detection

Default to database unique constraints with custom exception mapping. Only use pre-creation queries when no DB constraint exists.

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

### Pre-creation queries (fallback)

When no unique DB constraint exists, query before inserting:

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
