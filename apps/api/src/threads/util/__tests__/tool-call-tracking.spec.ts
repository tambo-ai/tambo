import { MessageRole, ToolCallRequest } from "@tambo-ai-cloud/core";
import {
  computePerToolCountsFromSignatures,
  DEFAULT_MAX_TOTAL_TOOL_CALLS,
  updateToolCallCounts,
  validateToolCallLimits,
} from "../tool-call-tracking";

// Test helper to create a mock thread message
const createMockThreadMessage = (
  toolCallRequest?: ToolCallRequest,
  toolCallId?: string,
) => ({
  id: "test-message-id",
  threadId: "test-thread-id",
  role: MessageRole.Assistant as const,
  content: [{ type: "text" as const, text: "test message" }],
  createdAt: new Date(),
  metadata: undefined,
  actionType: undefined,
  componentState: {},
  component: undefined,
  tool_call_id: toolCallId,
  error: undefined,
  toolCallRequest,
});

// Test helper to create a mock tool call request
const createMockToolCallRequest = (
  toolName: string,
  parameters: Array<{ parameterName: string; parameterValue: any }> = [],
): ToolCallRequest => ({
  toolName,
  parameters,
});

describe("tool-call-tracking utilities", () => {
  describe("updateToolCallCounts", () => {
    it("should add new tool call to empty counts", () => {
      const toolCallRequest = createMockToolCallRequest("testTool", [
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      const counts = {};

      const result = updateToolCallCounts(counts, toolCallRequest);

      expect(Object.keys(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toBe(1);
    });

    it("should increment existing tool call count", () => {
      const toolCallRequest = createMockToolCallRequest("testTool", [
        { parameterName: "param1", parameterValue: "value1" },
      ]);

      // First call
      let counts = updateToolCallCounts({}, toolCallRequest);
      expect(Object.values(counts)[0]).toBe(1);

      // Second call
      counts = updateToolCallCounts(counts, toolCallRequest);
      expect(Object.values(counts)[0]).toBe(2);

      // Third call
      counts = updateToolCallCounts(counts, toolCallRequest);
      expect(Object.values(counts)[0]).toBe(3);
    });

    it("should handle different tool calls with different counts", () => {
      const toolCall1 = createMockToolCallRequest("tool1", [
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      const toolCall2 = createMockToolCallRequest("tool2", [
        { parameterName: "param1", parameterValue: "value1" },
      ]);

      let counts = {};
      counts = updateToolCallCounts(counts, toolCall1);
      counts = updateToolCallCounts(counts, toolCall1);
      counts = updateToolCallCounts(counts, toolCall2);

      expect(Object.keys(counts)).toHaveLength(2);
      const values = Object.values(counts);
      expect(values).toContain(2); // tool1 called twice
      expect(values).toContain(1); // tool2 called once
    });

    it("should distinguish between same tool with different parameters", () => {
      const toolCall1 = createMockToolCallRequest("testTool", [
        { parameterName: "param1", parameterValue: "value1" },
      ]);
      const toolCall2 = createMockToolCallRequest("testTool", [
        { parameterName: "param1", parameterValue: "value2" },
      ]);

      let counts = {};
      counts = updateToolCallCounts(counts, toolCall1);
      counts = updateToolCallCounts(counts, toolCall2);

      expect(Object.keys(counts)).toHaveLength(2);
      expect(Object.values(counts)).toEqual([1, 1]);
    });

    it("should handle parameters in different order consistently", () => {
      const toolCall1 = createMockToolCallRequest("testTool", [
        { parameterName: "param1", parameterValue: "value1" },
        { parameterName: "param2", parameterValue: "value2" },
      ]);
      const toolCall2 = createMockToolCallRequest("testTool", [
        { parameterName: "param2", parameterValue: "value2" },
        { parameterName: "param1", parameterValue: "value1" },
      ]);

      let counts = {};
      counts = updateToolCallCounts(counts, toolCall1);
      counts = updateToolCallCounts(counts, toolCall2);

      // Should be treated as the same tool call
      expect(Object.keys(counts)).toHaveLength(1);
      expect(Object.values(counts)[0]).toBe(2);
    });

    it("should handle empty parameters", () => {
      const toolCallRequest = createMockToolCallRequest("testTool", []);
      const counts = {};

      const result = updateToolCallCounts(counts, toolCallRequest);

      expect(Object.keys(result)).toHaveLength(1);
      expect(Object.values(result)[0]).toBe(1);
    });
  });

  describe("validateToolCallLimits", () => {
    it("should return undefined for valid tool call under limits", () => {
      const toolCallRequest = createMockToolCallRequest("testTool");
      const finalMessage = createMockThreadMessage(toolCallRequest);
      const messages = [createMockThreadMessage()];
      const toolCounts = {};

      const result = validateToolCallLimits(
        finalMessage,
        messages,
        toolCounts,
        toolCallRequest,
        10,
      );

      expect(result).toBeUndefined();
    });

    it("should return error when total tool calls exceed limit", () => {
      const toolCallRequest = createMockToolCallRequest("testTool");
      const finalMessage = createMockThreadMessage(toolCallRequest);
      const messages = [createMockThreadMessage()];

      // Create counts that exceed the total limit (10)
      const toolCounts: Record<string, number> = {};
      for (let i = 0; i < 10; i++) {
        toolCounts[`tool-${i}`] = 1;
      }

      const result = validateToolCallLimits(
        finalMessage,
        messages,
        toolCounts,
        toolCallRequest,
        10,
      );

      expect(result).toContain("maximum number of tool calls");
      expect(result).toContain("10");
    });

    it("should return error when identical tool calls exceed limit", () => {
      const toolCallRequest = createMockToolCallRequest("testTool");
      const finalMessage = createMockThreadMessage(toolCallRequest);
      const messages = [createMockThreadMessage()];

      // Create counts where this specific tool call has been made 3 times
      const signature = JSON.stringify({
        toolName: "testTool",
        parameters: [],
      });
      const toolCounts = { [signature]: 3 };

      const result = validateToolCallLimits(
        finalMessage,
        messages,
        toolCounts,
        toolCallRequest,
        10,
      );

      expect(result).toContain("making the same tool call repeatedly");
      expect(result).toContain("testTool");
    });

    it("should detect identical tool loop in message history", () => {
      const toolCallRequest = createMockToolCallRequest("testTool");
      const finalMessage = createMockThreadMessage(toolCallRequest, "call-4");

      // Create a history with repeated identical tool calls
      // The function loops backwards from messages.length - 2, and needs assistant messages with tool_call_id AND toolCallRequest
      const messages = [
        createMockThreadMessage(toolCallRequest, "call-1"), // assistant with tool call
        createMockThreadMessage(toolCallRequest, "call-2"), // assistant with same tool call
        createMockThreadMessage(toolCallRequest, "call-3"), // assistant with same tool call again
        // The final message is not in the messages array, it's passed separately
      ];

      const result = validateToolCallLimits(
        finalMessage,
        messages,
        {},
        toolCallRequest,
        10,
      );

      expect(result).toContain("making the same tool call repeatedly");
      expect(result).toContain("stuck in a loop");
    });

    it("should not detect loop when tool calls are different", () => {
      const toolCallRequest1 = createMockToolCallRequest("tool1");
      const toolCallRequest2 = createMockToolCallRequest("tool2");
      const finalMessage = createMockThreadMessage(toolCallRequest1, "call-1");

      const messages = [
        createMockThreadMessage(), // user message
        createMockThreadMessage(toolCallRequest2, "call-1"), // different tool
        createMockThreadMessage(), // tool response
        createMockThreadMessage(toolCallRequest2, "call-2"), // same different tool
      ];

      const result = validateToolCallLimits(
        finalMessage,
        messages,
        {},
        toolCallRequest1,
        10,
      );

      expect(result).toBeUndefined();
    });

    it("should not detect loop when there are non-tool messages in between", () => {
      const toolCallRequest = createMockToolCallRequest("testTool");
      const finalMessage = createMockThreadMessage(toolCallRequest, "call-1");

      const messages = [
        createMockThreadMessage(), // user message
        createMockThreadMessage(toolCallRequest, "call-1"), // assistant with tool call
        createMockThreadMessage(), // tool response
        createMockThreadMessage(), // regular assistant message (no tool call)
        createMockThreadMessage(toolCallRequest, "call-2"), // assistant with tool call again
      ];

      const result = validateToolCallLimits(
        finalMessage,
        messages,
        {},
        toolCallRequest,
        10,
      );

      expect(result).toBeUndefined();
    });

    it("should handle final message without tool call request", () => {
      const toolCallRequest = createMockToolCallRequest("testTool");
      const finalMessage = createMockThreadMessage(); // no tool call request
      const messages = [createMockThreadMessage()];

      const result = validateToolCallLimits(
        finalMessage,
        messages,
        {},
        toolCallRequest,
        10,
      );

      expect(result).toBeUndefined();
    });

    it("should handle empty message history", () => {
      const toolCallRequest = createMockToolCallRequest("testTool");
      const finalMessage = createMockThreadMessage(toolCallRequest);

      const result = validateToolCallLimits(
        finalMessage,
        [],
        {},
        toolCallRequest,
        10,
      );

      expect(result).toBeUndefined();
    });

    it("should handle complex parameter values in signature generation", () => {
      const toolCallRequest = createMockToolCallRequest("testTool", [
        { parameterName: "simpleParam", parameterValue: "value" },
        { parameterName: "complexParam", parameterValue: { nested: "object" } },
        { parameterName: "arrayParam", parameterValue: [1, 2, 3] },
      ]);

      const finalMessage = createMockThreadMessage(toolCallRequest);
      const messages = [createMockThreadMessage()];

      const result = validateToolCallLimits(
        finalMessage,
        messages,
        {},
        toolCallRequest,
        10,
      );

      expect(result).toBeUndefined();
    });

    it("should aggregate different signatures for the same tool and enforce derived per-tool limits", () => {
      const toolCall1 = createMockToolCallRequest("aggTool", [
        { parameterName: "p1", parameterValue: "a" },
      ]);
      const toolCall2 = createMockToolCallRequest("aggTool", [
        { parameterName: "p1", parameterValue: "b" },
      ]);

      // two different signatures for the same tool -> per-tool total should be 2
      let counts: Record<string, number> = {};
      counts = updateToolCallCounts(counts, toolCall1);
      counts = updateToolCallCounts(counts, toolCall2);

      const finalMessage = createMockThreadMessage(toolCall1);

      // Provide a per-tool limit equal to 2; since derived per-tool total == 2,
      // validateToolCallLimits should return an error
      const toolLimits = { aggTool: { maxCalls: 2 } };

      const result = validateToolCallLimits(
        finalMessage,
        [],
        counts,
        createMockToolCallRequest("aggTool"),
        DEFAULT_MAX_TOTAL_TOOL_CALLS,
        undefined,
        toolLimits,
      );

      expect(result).toContain("maximum number of calls for tool");
      expect(result).toContain("aggTool");
    });

    it("should honor provided perToolCounts when supplied and enforce per-tool limit", () => {
      const finalMessage = createMockThreadMessage(
        createMockToolCallRequest("providedTool"),
      );

      const perToolCounts = { providedTool: 3 };
      const toolLimits = { providedTool: { maxCalls: 3 } };

      const result = validateToolCallLimits(
        finalMessage,
        [],
        {},
        createMockToolCallRequest("providedTool"),
        DEFAULT_MAX_TOTAL_TOOL_CALLS,
        perToolCounts,
        toolLimits,
      );

      expect(result).toContain("maximum number of calls for tool");
    });

    it("per-tool override should allow exceeding project-wide limit for that tool", () => {
      // Create counts so that the totalCalls (across signatures) >= project limit
      const otherCall = createMockToolCallRequest("otherTool");
      let counts: Record<string, number> = {};
      counts = updateToolCallCounts(counts, otherCall);
      counts = updateToolCallCounts(counts, otherCall); // totalCalls = 2

      // Per-tool override for `specialTool` should bypass project-level total check
      const perToolCounts = { specialTool: 1 };
      const toolLimits = { specialTool: { maxCalls: 5 } };

      const result = validateToolCallLimits(
        createMockThreadMessage(createMockToolCallRequest("specialTool")),
        [],
        counts,
        createMockToolCallRequest("specialTool"),
        2, // project maxToolCallLimit set to 2
        perToolCounts,
        toolLimits,
      );

      // Should be allowed because per-tool override exists and current per-tool total(1) < 5
      expect(result).toBeUndefined();
    });
  });

  describe("computePerToolCountsFromSignatures", () => {
    it("should aggregate counts for the same tool with different parameters", () => {
      const signatureCounts = {
        '{"toolName":"searchDatabase","parameters":[{"parameterName":"query","parameterValue":"test1"}]}': 2,
        '{"toolName":"searchDatabase","parameters":[{"parameterName":"query","parameterValue":"test2"}]}': 3,
        '{"toolName":"createUser","parameters":[{"parameterName":"name","parameterValue":"John"}]}': 1,
      };

      const result = computePerToolCountsFromSignatures(signatureCounts);

      expect(result).toEqual({
        searchDatabase: 5, // 2 + 3
        createUser: 1,
      });
    });

    it("should handle empty signature counts", () => {
      const result = computePerToolCountsFromSignatures({});

      expect(result).toEqual({});
    });

    it("should skip invalid JSON signatures", () => {
      const signatureCounts = {
        "invalid json": 2,
        '{"toolName":"validTool","parameters":[]}': 3,
      };

      const result = computePerToolCountsFromSignatures(signatureCounts);

      expect(result).toEqual({
        validTool: 3,
      });
    });

    it("should skip signatures without toolName", () => {
      const signatureCounts = {
        '{"parameters":[]}': 2,
        '{"toolName":"validTool","parameters":[]}': 3,
      };

      const result = computePerToolCountsFromSignatures(signatureCounts);

      expect(result).toEqual({
        validTool: 3,
      });
    });

    it("should handle multiple calls to the same tool", () => {
      const signatureCounts = {
        '{"toolName":"searchDatabase","parameters":[{"parameterName":"query","parameterValue":"test"}]}': 10,
      };

      const result = computePerToolCountsFromSignatures(signatureCounts);

      expect(result).toEqual({
        searchDatabase: 10,
      });
    });

    it("should correctly aggregate when tool is called with no parameters", () => {
      const signatureCounts = {
        '{"toolName":"noParamTool","parameters":[]}': 5,
        '{"toolName":"paramTool","parameters":[{"parameterName":"x","parameterValue":"y"}]}': 3,
      };

      const result = computePerToolCountsFromSignatures(signatureCounts);

      expect(result).toEqual({
        noParamTool: 5,
        paramTool: 3,
      });
    });
  });
});
