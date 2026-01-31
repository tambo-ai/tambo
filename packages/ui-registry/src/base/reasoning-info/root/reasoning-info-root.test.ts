import { describe, expect, it } from "@jest/globals";
import { formatReasoningDuration } from "./reasoning-info-root";

describe("formatReasoningDuration", () => {
  describe("sub-second durations", () => {
    it("returns message for 0ms", () => {
      expect(formatReasoningDuration(0)).toBe("Thought for less than 1 second");
    });

    it("returns message for 500ms", () => {
      expect(formatReasoningDuration(500)).toBe(
        "Thought for less than 1 second",
      );
    });

    it("returns message for 999ms", () => {
      expect(formatReasoningDuration(999)).toBe(
        "Thought for less than 1 second",
      );
    });

    it("handles negative values", () => {
      expect(formatReasoningDuration(-1000)).toBe(
        "Thought for less than 1 second",
      );
    });
  });

  describe("second-level durations", () => {
    it("returns singular for 1 second", () => {
      expect(formatReasoningDuration(1000)).toBe("Thought for 1 second");
    });

    it("returns plural for 2 seconds", () => {
      expect(formatReasoningDuration(2000)).toBe("Thought for 2 seconds");
    });

    it("returns plural for 30 seconds", () => {
      expect(formatReasoningDuration(30000)).toBe("Thought for 30 seconds");
    });

    it("returns plural for 59 seconds", () => {
      expect(formatReasoningDuration(59000)).toBe("Thought for 59 seconds");
    });
  });

  describe("minute-level durations", () => {
    it("returns singular for 1 minute", () => {
      expect(formatReasoningDuration(60000)).toBe("Thought for 1 minute");
    });

    it("returns plural for 2 minutes", () => {
      expect(formatReasoningDuration(120000)).toBe("Thought for 2 minutes");
    });

    it("returns plural for 30 minutes", () => {
      expect(formatReasoningDuration(1800000)).toBe("Thought for 30 minutes");
    });

    it("returns plural for 59 minutes", () => {
      expect(formatReasoningDuration(3540000)).toBe("Thought for 59 minutes");
    });
  });

  describe("hour-level durations", () => {
    it("returns singular for 1 hour", () => {
      expect(formatReasoningDuration(3600000)).toBe("Thought for 1 hour");
    });

    it("returns plural for 2 hours", () => {
      expect(formatReasoningDuration(7200000)).toBe("Thought for 2 hours");
    });

    it("returns plural for 24 hours", () => {
      expect(formatReasoningDuration(86400000)).toBe("Thought for 24 hours");
    });
  });
});
