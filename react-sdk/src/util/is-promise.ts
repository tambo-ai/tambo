/**
 *
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  if (value === null) {
    return false;
  }

  if (typeof value !== "object" && typeof value !== "function") {
    return false;
  }

  return typeof (value as { readonly then?: unknown }).then === "function";
}
