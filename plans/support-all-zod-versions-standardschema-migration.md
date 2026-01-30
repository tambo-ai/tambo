# feat(react-sdk): Support All Zod Versions via StandardSchema Migration

**Date:** 2026-01-20
**Type:** Enhancement (Breaking)
**Package:** `@tambo-ai/react`

---

## Overview

Remove the deprecated `toolSchema` API and simplify the codebase. The existing `@standard-community/standard-json` library with `toJsonSchema.sync()` handles Zod schema conversion via the StandardSchema interface.

**Minimum supported version:** Zod 3.24+ (including Zod 4.x).

**This is a deletion-focused change.** We're removing ~400 lines of deprecated code, not adding new infrastructure.

---

## Problem Statement

**Technical Debt:**

- `TamboToolWithToolSchema` is deprecated but still fully supported
- 222 lines of Zod-specific version detection in `react-sdk/src/schema/zod.ts`
- Multiple redundant type overloads in `defineTool()` for different schema formats
- Spread-args invocation path in tool-caller for legacy `toolSchema` format
- Weak `inputSchema` type (`SupportedSchema | unknown` is effectively `unknown`)

**The fix is simple:** Delete the deprecated code. The modern `inputSchema`/`outputSchema` API with `toJsonSchema.sync()` already handles Zod 3.24+ and 4.x.

---

## Proposed Solution

### What Changes

| Action                    | File                                        | Description                                                                                             |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Delete**                | `react-sdk/src/schema/zod.ts`               | 222 lines - `@standard-community/standard-json` handles Zod 3.24+ natively                              |
| **Remove types**          | `react-sdk/src/model/component-metadata.ts` | `TamboToolWithToolSchema`, `TamboToolZod3Function`, `TamboToolZod4Function`, tighten `inputSchema` type |
| **Remove schema helpers** | `react-sdk/src/schema/schema.ts`            | `getArgsFromToolSchema()`, `extractParamsFromJsonSchemaTuple()`, `toolSchema` branch                    |
| **Remove validation**     | `react-sdk/src/util/registry-validators.ts` | `toolSchema` validation branch, add runtime error with migration instructions                           |
| **Remove invocation**     | `react-sdk/src/util/tool-caller.ts`         | Spread-args invocation for `toolSchema`                                                                 |
| **Remove adapter**        | `react-sdk/src/util/registry.ts`            | `adaptToolFromFnSchema()` function                                                                      |
| **Simplify overloads**    | `react-sdk/src/model/component-metadata.ts` | Remove Zod-specific `defineTool()` overloads                                                            |
| **Remove test helpers**   | `react-sdk/src/testing/tools.ts`            | `createMockToolWithToolSchema()` and related                                                            |
| **Update tests**          | `react-sdk/src/**/*.test.ts`                | Remove/update `toolSchema` test cases                                                                   |
| **Migrate**               | `apps/web/lib/tambo/tools/*.ts`             | 16 usages across 7 files                                                                                |

### What Stays The Same

- **Registration remains synchronous** - `toJsonSchema.sync()` works for Zod 3.24+ and 4.x
- **No new provider state** - no `isRegistering`, no `registrationError`
- **Same public API** - `registerTool(tool)` signature unchanged
- **Same schema conversion** - `schemaToJsonSchema()` keeps using `.sync()`

### Schema Input Flow (Unchanged)

```
User provides schema
        │
        ▼
┌───────────────────┐
│ Is JSONSchema7?   │──Yes──► Use directly (no conversion)
└───────────────────┘
        │ No
        ▼
┌───────────────────┐
│ Is StandardSchema │──Yes──► Convert via toJsonSchema.sync()
└───────────────────┘
        │ No
        ▼
    Throw Error
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] Users can register tools with Zod 3.24+ or Zod 4.x schemas
- [ ] Users can register tools with raw JSON Schema objects
- [ ] `toolSchema` property causes TypeScript error if used
- [ ] Clear runtime error with migration instructions if `toolSchema` is passed:
  ```
  Tool "myTool" uses deprecated "toolSchema" property.
  Migrate to "inputSchema" and "outputSchema" properties.
  See migration guide: https://tambo.ai/docs/migration/toolschema
  ```

### Type Safety

- [ ] `inputSchema` type tightened from `SupportedSchema | unknown` to `SupportedSchema`
- [ ] TypeScript inference works correctly for StandardSchema inputs

### Quality Gates

- [ ] All existing tests pass or are updated for new API
- [ ] TypeScript strict mode passes
- [ ] ESLint passes without disabled rules
- [ ] Net reduction in lines of code (~400 LOC)

---

## Implementation

### Single Phase: Remove Deprecated API

**Tasks:**

1. **Delete `react-sdk/src/schema/zod.ts`**
   - The `@standard-community/standard-json` library handles Zod 3.24+ via StandardSchema
   - Remove the `loadVendor("zod", handleZodSchemaToJson)` call from `schema.ts`
   - Remove imports of `getZodFunctionArgs`, `handleZodSchemaToJson`, `isZodSchema`

2. **Remove deprecated code from `schema/schema.ts`:**
   - `getArgsFromToolSchema()` function
   - `extractParamsFromJsonSchemaTuple()` function
   - The `toolSchema` branch in `getParametersFromToolSchema()`

3. **Remove deprecated types from `component-metadata.ts`:**
   - `TamboToolWithToolSchema`
   - `TamboToolZod3Function`
   - `TamboToolZod4Function`
   - `TamboToolBase` union (just export `TamboTool` directly)
   - **Tighten type:** Change `inputSchema: SupportedSchema | unknown` to `inputSchema: SupportedSchema`

4. **Add runtime error in `registry-validators.ts`:**

   ```typescript
   if ("toolSchema" in tool) {
     throw new Error(
       `Tool "${tool.name}" uses deprecated "toolSchema" property. ` +
         `Migrate to "inputSchema" and "outputSchema" properties. ` +
         `See migration guide: https://tambo.ai/docs/migration/toolschema`,
     );
   }
   ```

   - Remove the existing `toolSchema` validation branch

5. **Remove spread-args invocation from `tool-caller.ts`:**
   - Delete the legacy path that spreads args for `toolSchema` tools
   - Tools now always receive a single params object

6. **Remove `adaptToolFromFnSchema()` from `registry.ts`:**
   - This adapter is only needed for `toolSchema` → `inputSchema` conversion

7. **Simplify `defineTool()` overloads in `component-metadata.ts`:**
   - Remove Zod 3/4 function-specific overloads
   - Keep: StandardSchema, JSONSchema, and generic TamboTool overloads

8. **Remove test helpers from `testing/tools.ts`:**
   - `createMockToolWithToolSchema()`
   - Any other `toolSchema`-specific helpers

9. **Update test files:**
   - `react-sdk/src/**/*.test.ts` - Remove/update `toolSchema` test cases
   - Ensure coverage for StandardSchema path

10. **Migrate internal consumers (16 usages across 7 files):**
    - `apps/web/lib/tambo/tools/*.ts`
    - Update any showcase examples still using `toolSchema`

**Files to modify:**

- `react-sdk/src/schema/zod.ts` (delete entirely)
- `react-sdk/src/schema/schema.ts` (remove `toolSchema` helpers + zod imports)
- `react-sdk/src/model/component-metadata.ts` (remove types, tighten `inputSchema`)
- `react-sdk/src/util/registry-validators.ts` (add error, remove branch)
- `react-sdk/src/util/tool-caller.ts` (remove spread-args path)
- `react-sdk/src/util/registry.ts` (remove adapter)
- `react-sdk/src/testing/tools.ts` (remove helpers)
- `react-sdk/src/**/*.test.ts` (update tests)
- `apps/web/lib/tambo/tools/*.ts` (migrate 16 usages)

---

## Migration Guide for Users

**Minimum Zod version:** 3.24+ (StandardSchema-compliant). Users on older Zod versions must upgrade.

Users with `toolSchema` need to migrate to `inputSchema`/`outputSchema`:

```diff
const myTool = defineTool({
  name: "myTool",
  description: "Does something",
- toolSchema: z.function()
-   .args(z.object({ input: z.string() }))
-   .returns(z.number()),
+ inputSchema: z.object({ input: z.string() }),
+ outputSchema: z.number(),
- tool: (input: string) => input.length,
+ tool: ({ input }) => input.length,
});
```

**Key differences:**

- `toolSchema` (function schema) → `inputSchema` + `outputSchema` (separate object schemas)
- Tool function receives single params object, not spread args
- Minimum Zod version is now 3.24+ (for StandardSchema support)

---

## Risks

| Risk                              | Likelihood | Impact | Mitigation                                          |
| --------------------------------- | ---------- | ------ | --------------------------------------------------- |
| Users still using `toolSchema`    | Medium     | High   | TypeScript error + runtime error with migration URL |
| Users on Zod < 3.24               | Low        | High   | Document minimum version, clear error message       |
| Internal tools not fully migrated | Low        | Medium | Search codebase before merging (16 known usages)    |

---

## Success Metrics

| Metric                   | Target                   |
| ------------------------ | ------------------------ |
| Lines of code removed    | ~400                     |
| New infrastructure added | 0                        |
| Breaking API changes     | 1 (`toolSchema` removal) |
| Zod versions supported   | 3.24+ and 4.x            |

---

## References

### Internal

- Current TamboTool types: `react-sdk/src/model/component-metadata.ts:147-371`
- Schema conversion: `react-sdk/src/schema/schema.ts:56-62` (uses `toJsonSchema.sync()`)
- Zod handling to delete: `react-sdk/src/schema/zod.ts` (222 lines)
- Tool invocation: `react-sdk/src/util/tool-caller.ts:88-106`
- Schema helpers to delete: `react-sdk/src/schema/schema.ts:105-235`

### External

- [StandardSchema Specification](https://standardschema.dev/)
- [@standard-community/standard-json](https://github.com/standard-community/standard-json)
