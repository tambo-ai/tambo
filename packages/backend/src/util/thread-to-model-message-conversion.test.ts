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
    expect(result[0]).toMatchObject({ role: "assistant" });

    const content = (result[0] as any).content as any[];
    const toolCalls = content.filter((p) => p.type === "tool-call");
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0]).toMatchObject({
      toolCallId: "tool-call-1",
      toolName: "show_component_Graph",
    });

    const texts = content.filter((p) => p.type === "text");
    expect(texts).toHaveLength(1);
    expect(texts[0].text).toContain('"componentName":"Graph"');
  });
});
