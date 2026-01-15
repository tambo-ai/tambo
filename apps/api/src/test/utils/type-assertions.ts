export type IsAny<T> = 0 extends 1 & T ? true : false;

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
