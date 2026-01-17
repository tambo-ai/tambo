import { ContentPartType, MessageRole } from "@tambo-ai-cloud/core";
import {
  convertToolResultsToMessages,
  dedupeToolResults,
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

  describe("dedupeToolResults", () => {
    it("dedupes tool results and returns duplicate tool call IDs", () => {
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
        {
          toolUseId: "call_2",
          content: [{ type: "text" as const, text: "result 2" }],
          isError: false,
        },
        {
          toolUseId: "call_2",
          content: [{ type: "text" as const, text: "result 2 again" }],
          isError: false,
        },
      ];

      const result = dedupeToolResults(toolResults);

      expect(result.toolResults).toHaveLength(2);
      expect(result.toolResults.map((r) => r.toolUseId)).toEqual([
        "call_1",
        "call_2",
      ]);
      expect(result.duplicateToolCallIds).toEqual(["call_1", "call_2"]);
    });

    it("returns empty duplicate list when there are no duplicates", () => {
      const toolResults = [
        {
          toolUseId: "call_1",
          content: [{ type: "text" as const, text: "result 1" }],
          isError: false,
        },
      ];

      const result = dedupeToolResults(toolResults);

      expect(result.toolResults).toHaveLength(1);
      expect(result.duplicateToolCallIds).toEqual([]);
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

  describe("convertToolResultsToMessages", () => {
    it("converts tool results to MessageRequest array with Tool role", () => {
      const toolResults = [
        {
          toolUseId: "call_123",
          content: [{ type: "text" as const, text: "Weather is sunny, 72°F" }],
          isError: false,
        },
        {
          toolUseId: "call_456",
          content: [{ type: "text" as const, text: "Stock price: $150.00" }],
          isError: false,
        },
      ];

      const messages = convertToolResultsToMessages(toolResults);

      expect(messages).toHaveLength(2);

      expect(messages[0].role).toBe(MessageRole.Tool);
      expect(messages[0].tool_call_id).toBe("call_123");
      expect(messages[0].content).toEqual([
        { type: ContentPartType.Text, text: "Weather is sunny, 72°F" },
      ]);

      expect(messages[1].role).toBe(MessageRole.Tool);
      expect(messages[1].tool_call_id).toBe("call_456");
      expect(messages[1].content).toEqual([
        { type: ContentPartType.Text, text: "Stock price: $150.00" },
      ]);
    });

    it("converts resource content in tool results", () => {
      const toolResults = [
        {
          toolUseId: "call_resource",
          content: [
            {
              type: "resource" as const,
              resource: {
                uri: "file://data.csv",
                text: "a,b,c\n1,2,3",
                mimeType: "text/csv",
              },
            },
          ],
          isError: false,
        },
      ];

      const messages = convertToolResultsToMessages(toolResults);

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe(MessageRole.Tool);
      expect(messages[0].tool_call_id).toBe("call_resource");
      expect(messages[0].content).toEqual([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "file://data.csv",
            text: "a,b,c\n1,2,3",
            mimeType: "text/csv",
          },
        },
      ]);
    });

    it("handles mixed text and resource content", () => {
      const toolResults = [
        {
          toolUseId: "call_mixed",
          content: [
            { type: "text" as const, text: "Processing complete:" },
            {
              type: "resource" as const,
              resource: { uri: "file://output.json", text: '{"status":"ok"}' },
            },
          ],
          isError: false,
        },
      ];

      const messages = convertToolResultsToMessages(toolResults);

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toHaveLength(2);
      expect(messages[0].content[0].type).toBe(ContentPartType.Text);
      expect(messages[0].content[1].type).toBe(ContentPartType.Resource);
    });

    it("returns empty array for empty input", () => {
      const messages = convertToolResultsToMessages([]);

      expect(messages).toHaveLength(0);
    });

    it("throws on unknown content type", () => {
      const toolResults = [
        {
          toolUseId: "call_unknown",
          content: [{ type: "unknown" as "text", text: "test" }],
          isError: false,
        },
      ];

      expect(() => convertToolResultsToMessages(toolResults)).toThrow(
        "Unknown content type in tool result: unknown",
      );
    });
  });
});
