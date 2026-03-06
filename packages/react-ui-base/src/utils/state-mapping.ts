export function stateBooleanMapping(
  key: string,
): (value: unknown) => Record<string, string> | null {
  const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
  return (value: unknown) => (value ? { [`data-${kebabKey}`]: "" } : null);
}

export function stateStringMapping(
  key: string,
): (value: unknown) => Record<string, string> | null {
  const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
  return (value: unknown) =>
    value ? { [`data-${kebabKey}`]: String(value) } : null;
}
