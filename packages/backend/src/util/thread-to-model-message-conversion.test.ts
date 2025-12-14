import {
  ContentPartType,
  MessageRole,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { createMockThreadMessage } from "@tambo-ai-cloud/testing";
import { convertAssistantMessage } from "./thread-to-model-message-conversion";

describe("convertAssistantMessage", () => {
  const isSupportedMimeType = () => true;

  it("should convert assistant message with component and tool call correctly", () => {
    const toolCallRequest: ToolCallRequest = {
      toolName: "show_component_Graph",
      parameters: [
        {
          parameterName: "data",
          parameterValue: [1, 2, 3],
        },
      ],
    };

    const assistantMessage = createMockThreadMessage(
      "msg-1",
      "thread-1",
      MessageRole.Assistant,
      [{ type: ContentPartType.Text, text: "Here's a graph" }],
      {
        tool_call_id: "tool-call-1",
        toolCallRequest,
        component: {
          componentName: "Graph",
          message: "Here's a graph",
          props: { data: [1, 2, 3] },
          componentState: null,
        },
      },
    );

    // Include tool_call_id in respondedToolIds to test Case 2 (not Case 1)
    const result = convertAssistantMessage(
      assistantMessage,
      ["tool-call-1"],
      isSupportedMimeType,
    );

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("assistant");

    const assistantMsg = result[0] as { role: string; content: unknown[] };
    const content = assistantMsg.content as Array<{
      type: string;
      text?: string;
      toolCallId?: string;
      toolName?: string;
    }>;

    // Should have component as text content
    const textParts = content.filter((c) => c.type === "text");
    expect(textParts.length).toBeGreaterThan(0);

    // Should have the tool call
    const toolCallParts = content.filter(
      (c) => c.type === "tool-call",
    ) as Array<{
      type: string;
      toolCallId: string;
      toolName: string;
    }>;
    expect(toolCallParts).toHaveLength(1);
    expect(toolCallParts[0]?.toolName).toBe("show_component_Graph");
    expect(toolCallParts[0]?.toolCallId).toBe("tool-call-1");
  });
});
