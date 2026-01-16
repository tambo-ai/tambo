import {
  extractToolResults,
  validateToolResults,
  hasPendingToolCalls,
} from "./v1-tool-results";
import type { V1InputMessageDto } from "./dto/message.dto";

describe("v1-tool-results", () => {
  describe("extractToolResults", () => {
    it("extracts tool_result content blocks from message", () => {
      const message: V1InputMessageDto = {
        role: "user",
        content: [
          { type: "text", text: "Here are the results" },
          {
            type: "tool_result",
            toolUseId: "call_123",
            content: [{ type: "text", text: "Weather is sunny" }],
          },
          {
            type: "tool_result",
            toolUseId: "call_456",
            content: [{ type: "text", text: "Stock price is $150" }],
            isError: false,
          },
        ],
      };

      const results = extractToolResults(message);

      expect(results).toHaveLength(2);
      expect(results[0].toolUseId).toBe("call_123");
      expect(results[0].content).toEqual([
        { type: "text", text: "Weather is sunny" },
      ]);
      expect(results[0].isError).toBe(false);
      expect(results[1].toolUseId).toBe("call_456");
      expect(results[1].isError).toBe(false);
    });

    it("extracts tool_result with isError flag", () => {
      const message: V1InputMessageDto = {
        role: "user",
        content: [
          {
            type: "tool_result",
            toolUseId: "call_error",
            content: [{ type: "text", text: "API error: rate limited" }],
            isError: true,
          },
        ],
      };

      const results = extractToolResults(message);

      expect(results).toHaveLength(1);
      expect(results[0].isError).toBe(true);
    });

    it("returns empty array when no tool_result blocks", () => {
      const message: V1InputMessageDto = {
        role: "user",
        content: [{ type: "text", text: "Just a text message" }],
      };

      const results = extractToolResults(message);

      expect(results).toHaveLength(0);
    });

    it("handles empty content array", () => {
      const message = {
        role: "user",
        content: [],
      } as unknown as V1InputMessageDto;

      const results = extractToolResults(message);

      expect(results).toHaveLength(0);
    });
  });

  describe("validateToolResults", () => {
    it("returns valid when all pending tool calls have results", () => {
      const toolResults = [
        {
          toolUseId: "call_1",
          content: [{ type: "text" as const, text: "result 1" }],
          isError: false,
        },
        {
          toolUseId: "call_2",
          content: [{ type: "text" as const, text: "result 2" }],
          isError: false,
        },
      ];
      const pendingToolCallIds = ["call_1", "call_2"];

      const result = validateToolResults(toolResults, pendingToolCallIds);

      expect(result.valid).toBe(true);
    });

    it("returns invalid when missing results for pending tool calls", () => {
      const toolResults = [
        {
          toolUseId: "call_1",
          content: [{ type: "text" as const, text: "result 1" }],
          isError: false,
        },
      ];
      const pendingToolCallIds = ["call_1", "call_2", "call_3"];

      const result = validateToolResults(toolResults, pendingToolCallIds);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe("MISSING_RESULTS");
        expect(result.error.missingToolCallIds).toEqual(["call_2", "call_3"]);
        expect(result.error.message).toContain("call_2");
        expect(result.error.message).toContain("call_3");
      }
    });

    it("returns invalid when extra results provided", () => {
      const toolResults = [
        {
          toolUseId: "call_1",
          content: [{ type: "text" as const, text: "result 1" }],
          isError: false,
        },
        {
          toolUseId: "call_unknown",
          content: [{ type: "text" as const, text: "result ?" }],
          isError: false,
        },
      ];
      const pendingToolCallIds = ["call_1"];

      const result = validateToolResults(toolResults, pendingToolCallIds);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe("EXTRA_RESULTS");
        expect(result.error.extraToolCallIds).toEqual(["call_unknown"]);
      }
    });

    it("prioritizes missing results over extra results", () => {
      // When both missing and extra exist, report missing first (fail-fast on most critical)
      const toolResults = [
        {
          toolUseId: "call_unknown",
          content: [{ type: "text" as const, text: "result" }],
          isError: false,
        },
      ];
      const pendingToolCallIds = ["call_1"];

      const result = validateToolResults(toolResults, pendingToolCallIds);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error.code).toBe("MISSING_RESULTS");
      }
    });

    it("returns valid for empty pending list with no results", () => {
      const result = validateToolResults([], []);

      expect(result.valid).toBe(true);
    });

    it("handles duplicate tool call IDs in results", () => {
      const toolResults = [
        {
          toolUseId: "call_1",
          content: [{ type: "text" as const, text: "result 1" }],
          isError: false,
        },
        {
          toolUseId: "call_1",
          content: [{ type: "text" as const, text: "result 1 again" }],
          isError: false,
        },
      ];
      const pendingToolCallIds = ["call_1"];

      // Duplicate results for the same ID - should still be valid since the ID is covered
      const result = validateToolResults(toolResults, pendingToolCallIds);

      expect(result.valid).toBe(true);
    });
  });

  describe("hasPendingToolCalls", () => {
    it("returns true for non-empty array", () => {
      expect(hasPendingToolCalls(["call_1", "call_2"])).toBe(true);
    });

    it("returns false for empty array", () => {
      expect(hasPendingToolCalls([])).toBe(false);
    });

    it("returns false for null", () => {
      expect(hasPendingToolCalls(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(hasPendingToolCalls(undefined)).toBe(false);
    });
  });
});
