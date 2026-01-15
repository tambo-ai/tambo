import { encodeV1CompoundCursor } from "../v1-pagination";

describe("v1-pagination", () => {
  describe("encodeV1CompoundCursor", () => {
    it("should throw when id is empty", () => {
      expect(() =>
        encodeV1CompoundCursor({
          createdAt: new Date("2024-01-01T00:00:00Z"),
          id: "",
        }),
      ).toThrow("Cannot encode cursor: id is empty");
    });

    it("should throw when createdAt is invalid", () => {
      expect(() =>
        encodeV1CompoundCursor({
          createdAt: new Date("not-a-date"),
          id: "thr_123",
        }),
      ).toThrow("Cannot encode cursor: createdAt is invalid");
    });
  });
});
