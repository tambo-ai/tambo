import { z } from "zod";
import { ContextHelperFn } from "./types";

export function createInteractablesContextHelper(
  getInteractables: () => {
    id: string;
    name: string;
    props: Record<string, any>;
    propsSchema?: z.ZodTypeAny | Record<string, any>;
  }[],
): ContextHelperFn {
  return () => {
    try {
      const interactables = getInteractables();
      return {
        components: interactables.map((c) => ({
          id: c.id,
          componentName: c.name,
          props: c.props,
          propsSchema: c.propsSchema &&
            typeof (c.propsSchema as any).safeParse === "function"
            ? (c.propsSchema as any).shape ?? {}
            : c.propsSchema,
        })),
      };
    } catch (e) {
      console.error("interactables context helper failed:", e);
      return null;
    }
  };
}

