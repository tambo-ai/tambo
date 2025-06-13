import { z, ZodFirstPartyTypeKind, ZodTypeAny } from "zod";

/**
 * Recursively walks a Zod schema and throws when it encounters `z.record()`.
 * Records are not serialisable to JSON-Schema in a way that the Tambo backend
 * understands, so they are disallowed.
 * @param schema      The root Zod schema to inspect.
 * @param contextName A human-readable label echoed in the error message.
 */
export function assertNoZodRecord(
  schema: ZodTypeAny,
  contextName = "schema",
): void {
  const visited = new WeakSet<ZodTypeAny>();

  const visit = (current: ZodTypeAny, path: string[]): void => {
    if (
      !current ||
      typeof current !== "object" ||
      !(current instanceof z.ZodType)
    )
      return;
    if (visited.has(current)) return;

    const def: any = (current as any)._def;
    const typeName: ZodFirstPartyTypeKind | undefined = def?.typeName;

    // ───────────────────── Disallowed ─────────────────────
    if (typeName === ZodFirstPartyTypeKind.ZodRecord) {
      const joined = path.length ? path.join(".") : "(root)";
      throw new Error(
        `z.record() is not supported in ${contextName}. ` +
          `Found at path "${joined}". ` +
          "Replace it with z.object({ ... }) using explicit keys.",
      );
    }

    visited.add(current);

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
      current.items.forEach((item: ZodTypeAny, idx: number) =>
        visit(item, [...path, `${idx}`]),
      );
      return;
    }

    if (current instanceof z.ZodUnion) {
      def.options.forEach((opt: ZodTypeAny, idx: number) =>
        visit(opt, [...path, `|${idx}`]),
      );
      return;
    }

    if (current instanceof z.ZodDiscriminatedUnion) {
      current.options.forEach((opt: ZodTypeAny, idx: number) =>
        visit(opt, [...path, `|${idx}`]),
      );
      return;
    }

    if (current instanceof z.ZodIntersection) {
      visit(def.left, [...path, "&0"]);
      visit(def.right, [...path, "&1"]);
      return;
    }

    // ───────────── Wrapper / pass-through types ───────────
    const potentialKeys = [
      "schema",
      "innerType",
      "type",
      "in",
      "out",
      "left",
      "right",
    ] as const;

    for (const key of potentialKeys) {
      const maybe = def?.[key];
      if (maybe instanceof z.ZodType) visit(maybe, path);
      else if (Array.isArray(maybe))
        maybe.forEach((sub) => sub instanceof z.ZodType && visit(sub, path));
    }

    if (typeof def?.getter === "function") {
      try {
        const lazySchema = def.getter();
        if (lazySchema instanceof z.ZodType) visit(lazySchema, [...path]);
      } catch {
        // Ignore lazy getter execution errors.
      }
    }
  };

  visit(schema, []);
}
