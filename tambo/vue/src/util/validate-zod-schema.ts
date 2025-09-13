import { z, ZodFirstPartyTypeKind, ZodTypeAny } from "zod";

export function assertNoZodRecord(
  schema: ZodTypeAny,
  contextName = "schema",
): void {
  const visited = new WeakSet<ZodTypeAny>();

  const visit = (current: ZodTypeAny, path: string[]): void => {
    if (!current || typeof current !== "object" || !(current instanceof z.ZodType)) return;
    if (visited.has(current)) return;

    const def: any = (current as any)._def;
    const typeName: ZodFirstPartyTypeKind | undefined = def?.typeName;

    if (typeName === ZodFirstPartyTypeKind.ZodRecord) {
      const joined = path.length ? path.join(".") : "(root)";
      throw new Error(
        `z.record() is not supported in ${contextName}. ` +
          `Found at path "${joined}". ` +
          "Replace it with z.object({ ... }) using explicit keys.",
      );
    }

    visited.add(current);

    if (current instanceof z.ZodObject) {
      for (const key of Object.keys((current as any).shape)) {
        visit((current as any).shape[key], [...path, key]);
      }
      return;
    }

    if (current instanceof z.ZodArray) {
      visit((current as any).element, [...path, "[]"]);
      return;
    }

    if (current instanceof z.ZodTuple) {
      (current as any).items.forEach((item: ZodTypeAny, idx: number) =>
        visit(item, [...path, `${idx}`]),
      );
      return;
    }

    if (current instanceof z.ZodUnion) {
      def.options.forEach((opt: ZodTypeAny, idx: number) => visit(opt, [...path, `|${idx}`]));
      return;
    }

    if (current instanceof z.ZodDiscriminatedUnion) {
      (current as any).options.forEach((opt: ZodTypeAny, idx: number) => visit(opt, [...path, `|${idx}`]));
      return;
    }

    if (current instanceof z.ZodIntersection) {
      visit(def.left, [...path, "&0"]);
      visit(def.right, [...path, "&1"]);
      return;
    }

    const potentialKeys = ["schema", "innerType", "type", "in", "out", "left", "right"] as const;
    for (const key of potentialKeys) {
      const maybe = def?.[key];
      if (maybe instanceof z.ZodType) visit(maybe, path);
      else if (Array.isArray(maybe)) maybe.forEach((sub) => sub instanceof z.ZodType && visit(sub, path));
    }

    if (typeof def?.getter === "function") {
      try {
        const lazySchema = def.getter();
        if (lazySchema instanceof z.ZodType) visit(lazySchema, [...path]);
      } catch {}
    }
  };

  visit(schema, []);
}

