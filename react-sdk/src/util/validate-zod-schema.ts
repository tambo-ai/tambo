import {
  z,
  ZodTypeAny,
  ZodFirstPartyTypeKind,
} from "zod";

/**
 * Recursively walks a Zod schema and throws when it encounters `z.record()`.
 * Records are not serialisable to JSON-Schema in a way that the Tambo backend
 * understands, so they are disallowed.
 *
 * @param schema      The root Zod schema to inspect.
 * @param contextName A human-readable label that will be echoed in the error
 *                    message (e.g. `"propsSchema of component \"Chart\""`).
 */
export function assertNoZodRecord(
  schema: ZodTypeAny,
  contextName: string = "schema",
): void {
  const visit = (current: ZodTypeAny, path: string[]): void => {
    const typeName = (current as any)._def?.typeName;

    // ───────────────────── Disallowed ─────────────────────
    if (typeName === ZodFirstPartyTypeKind.ZodRecord) {
      const joined = path.length ? path.join(".") : "(root)";
      throw new Error(
        `z.record() is not supported in ${contextName}. ` +
          `Found at path "${joined}". ` +
          "Replace it with z.object({ ... }) using explicit keys.",
      );
    }

    // ─────────────────── Wrapper types ────────────────────
    if (
      current instanceof z.ZodOptional ||
      current instanceof z.ZodNullable ||
      current instanceof z.ZodDefault ||
      current instanceof z.ZodEffects
    ) {
      visit((current as any)._def.schema, path);
      return;
    }

    // ─────────────── Composite / container types ──────────
    if (current instanceof z.ZodObject) {
      for (const key of Object.keys(current.shape)) {
        visit(current.shape[key], [...path, key]);
      }
      return;
    }

    if (current instanceof z.ZodArray) {
      visit(current.element, [...path, "[]"]);
      return;
    }

    if (current instanceof z.ZodTuple) {
      current.items.forEach((item, idx) =>
        visit(item, [...path, `${idx}`]),
      );
      return;
    }

    if (current instanceof z.ZodUnion) {
      (current as any)._def.options.forEach((opt: ZodTypeAny, idx: number) =>
        visit(opt, [...path, `|${idx}`]),
      );
      return;
    }

    if (current instanceof z.ZodDiscriminatedUnion) {
      (current as any).options.forEach((opt: ZodTypeAny, idx: number) =>
        visit(opt, [...path, `|${idx}`]),
      );
      return;
    }

    if (current instanceof z.ZodIntersection) {
      visit((current as any)._def.left, [...path, "&0"]);
      visit((current as any)._def.right, [...path, "&1"]);
      return;
    }

    // Primitive leaf types need no further inspection.
  };

  visit(schema, []);
}
