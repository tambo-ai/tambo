import { SystemTools } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { callSystemTool, extractToolResponse } from "../tool";

describe("tool utilities", () => {
  describe("extractToolResponse", () => {
    it("should parse JSON from text content", () => {
      const response = { key: "value" };
      const message: ThreadMessage = {
        id: "1",
        threadId: "1",
        createdAt: new Date(),
        content: [
          {
            type: ContentPartType.Text,
            text: JSON.stringify(response),
          },
        ],
        role: MessageRole.Tool,
      };
      expect(extractToolResponse(message)).toEqual(response);
    });

    it("should return text content if not JSON", () => {
      const text = "plain text response";
      const message: ThreadMessage = {
        id: "1",
        threadId: "1",
        createdAt: new Date(),
        content: [
          {
            type: ContentPartType.Text,
            text,
          },
        ],
        role: MessageRole.Tool,
      };
      expect(extractToolResponse(message)).toBe(text);
    });

    it("should filter out resource content parts", () => {
      const text = "text response";
      const message: ThreadMessage = {
        id: "1",
        threadId: "1",
        createdAt: new Date(),
        content: [
          {
            type: "resource" as any,
            text: "resource",
          },
          {
            type: ContentPartType.Text,
            text,
          },
        ],
        role: MessageRole.Tool,
      };
      expect(extractToolResponse(message)).toBe(text);
    });

    it("should return null for non-text content", () => {
      const message: ThreadMessage = {
        id: "1",
        threadId: "1",
        createdAt: new Date(),
        content: [
          {
            type: ContentPartType.ImageUrl,
            image_url: { url: "test.jpg" },
          },
        ],
        role: MessageRole.Tool,
      };
      expect(extractToolResponse(message)).toBeNull();
    });
  });

  describe("callSystemTool", () => {
    const mockSystemTools: SystemTools = {
      mcpToolSources: {
        testTool: {
          callTool: jest.fn(),
        },
      },
    } as unknown as SystemTools;

    const toolCallRequest = {
      toolName: "testTool",
      parameters: [
        { parameterName: "param1", parameterValue: "value1" },
        { parameterName: "param2", parameterValue: "value2" },
      ],
    };

    const componentDecision = {
      message: "test message",
      componentName: "TestComponent",
      props: {},
      componentState: {},
      reasoning: "test reasoning",
    };

    const advanceRequestDto = {
      messageToAppend: {
        role: MessageRole.Tool,
        content: [],
      },
      availableComponents: [],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should call tool and return formatted response for string result", async () => {
      const mockResult = "test result";
      jest
        .mocked(mockSystemTools.mcpToolSources.testTool.callTool)
        .mockResolvedValue({
          content: [{ type: ContentPartType.Text, text: mockResult }],
        });

      const result = await callSystemTool(
        mockSystemTools,
        toolCallRequest,
        "tool-call-1",
        componentDecision,
        advanceRequestDto,
      );

      expect(
        mockSystemTools.mcpToolSources.testTool.callTool,
      ).toHaveBeenCalledWith("testTool", {
        param1: "value1",
        param2: "value2",
      });

      expect(result).toEqual({
        messageToAppend: {
          actionType: ActionType.ToolResponse,
          component: componentDecision,
          role: MessageRole.Tool,
          content: [{ type: ContentPartType.Text, text: mockResult }],
          tool_call_id: "tool-call-1",
        },
        availableComponents: advanceRequestDto.availableComponents,
        contextKey: undefined,
      });
    });

    it("should handle array content in tool response", async () => {
      const mockResult = {
        content: [
          { type: ContentPartType.Text, text: "part 1" },
          { type: ContentPartType.Text, text: "part 2" },
        ],
      };
      (
        mockSystemTools.mcpToolSources.testTool.callTool as jest.Mock
      ).mockResolvedValue(mockResult);

      const result = await callSystemTool(
        mockSystemTools,
        toolCallRequest,
        "tool-call-1",
        componentDecision,
        advanceRequestDto,
      );

      expect(result.messageToAppend.content).toEqual(mockResult.content);
    });

    it("should throw error when no response content", async () => {
      const mockResult = { content: [] };
      (
        mockSystemTools.mcpToolSources.testTool.callTool as jest.Mock
      ).mockResolvedValue(mockResult);

      await expect(
        callSystemTool(
          mockSystemTools,
          toolCallRequest,
          "tool-call-1",
          componentDecision,
          advanceRequestDto,
        ),
      ).rejects.toThrow("No response content found");
    });
  });
});
