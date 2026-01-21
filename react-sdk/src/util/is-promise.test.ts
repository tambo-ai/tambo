import { isPromise } from "../util/is-promise";

describe("isPromise", () => {
  it("should return true for real Promise instances", () => {
    expect(isPromise(Promise.resolve(1))).toBe(true);
    expect(isPromise(new Promise(() => {}))).toBe(true);
  });

  it("should return true for custom thenables", () => {
    const thenable = {
      then: () => {},
    };

    expect(isPromise(thenable)).toBe(true);
  });

  it("should return true for function with a then method", () => {
    const fn = () => {};
    fn.then = () => {};

    expect(isPromise(fn)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isPromise(null)).toBe(false);
  });

  it("should return false for primitive values", () => {
    expect(isPromise(0)).toBe(false);
    expect(isPromise("text")).toBe(false);
    expect(isPromise(true)).toBe(false);
    expect(isPromise(undefined)).toBe(false);
    expect(isPromise(Symbol("sym"))).toBe(false);
    expect(isPromise(10n)).toBe(false);
  });

  it("should return false for object without then method", () => {
    expect(isPromise({})).toBe(false);
    expect(isPromise({ status: "active" })).toBe(false);
  });

  it("should return false when then exists but is not a function", () => {
    expect(isPromise({ then: 123 })).toBe(false);
    expect(isPromise({ then: "not-a-function" })).toBe(false);
  });

  it("should handle Promise-like object created via Promise.resolve", () => {
    const value = Promise.resolve("ok");
    expect(isPromise(value)).toBe(true);
  });

  it("should not throw for unexpected input types", () => {
    expect(() => isPromise(Object.create(null))).not.toThrow();
    expect(isPromise(Object.create(null))).toBe(false);
  });
});
