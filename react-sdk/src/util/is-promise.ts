/**
 *
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  if (value === null) {
    return false;
  }

  const valueType = typeof value;
  if (valueType !== "object" && valueType !== "function") {
    return false;
  }

  return (
    "then" in value &&
    typeof (value as { readonly then?: unknown }).then === "function"
  );
}
