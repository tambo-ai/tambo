export type HelperFn = () => any | null | undefined | Promise<any | null | undefined>;

export async function resolveAdditionalContext(
  helpers: Record<string, HelperFn>,
): Promise<{ name: string; context: any }[]> {
  const entries = Object.entries(helpers);
  if (entries.length === 0) return [];
  const results = await Promise.all(
    entries.map(async ([name, fn]) => {
      try {
        const value = await fn();
        if (value == null) return null;
        return { name, context: value };
      } catch (error) {
        console.error(`Error running context helper ${name}:`, error);
        return null;
      }
    }),
  );
  return results.filter(Boolean) as { name: string; context: any }[];
}

