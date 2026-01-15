// Test-only type utilities. Do not import from production code.

// `IsAny<T>` is true iff T is `any`.
export type IsAny<T> = 0 extends 1 & T ? true : false;

// `IsUnknown<T>` is true iff T is exactly `unknown`.
// Note: `any` is explicitly excluded and will return false.
export type IsUnknown<T> =
  IsAny<T> extends true
    ? false
    : unknown extends T
      ? [T] extends [unknown]
        ? true
        : false
      : false;

export function assertTrue<T extends true>(_value: T): T {
  return _value;
}
