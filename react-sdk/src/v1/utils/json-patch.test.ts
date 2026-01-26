import type { Operation } from "fast-json-patch";
import { applyJsonPatch } from "./json-patch";

describe("applyJsonPatch error handling", () => {
  it("includes operation summary in error message", () => {
    const target = { existing: "value" };
    const operations: Operation[] = [
      { op: "replace", path: "/nonexistent", value: "fail" },
    ];

    expect(() => applyJsonPatch(target, operations)).toThrow(
      /Failed to apply JSON patch operations \[replace \/nonexistent\]/,
    );
  });

  it("includes target keys in error message", () => {
    const target = { foo: 1, bar: 2 };
    const operations: Operation[] = [
      { op: "replace", path: "/missing", value: "x" },
    ];

    expect(() => applyJsonPatch(target, operations)).toThrow(
      /Target had keys: \[foo, bar\]/,
    );
  });

  it("shows all operations in error summary", () => {
    const target = {};
    const operations: Operation[] = [
      { op: "add", path: "/a", value: 1 },
      { op: "replace", path: "/missing", value: 2 },
    ];

    expect(() => applyJsonPatch(target, operations)).toThrow(
      /add \/a, replace \/missing/,
    );
  });
});
