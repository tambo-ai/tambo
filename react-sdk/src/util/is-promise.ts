/**
 *
 */
/**
 * Checks whether a value is a Promise/thenable.
 * @returns True if the value has a callable `then()` function.
 */
export function isPromise(value: unknown): value is Promise<unknown> {
  if (value === null) {
    return false;
  }

  if (typeof value !== "object" && typeof value !== "function") {
    return false;
  }

  return typeof (value as { readonly then?: unknown }).then === "function";
}
