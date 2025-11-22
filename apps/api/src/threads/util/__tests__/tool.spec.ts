import { McpToolRegistry, prefixToolName } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  LegacyComponentDecision,
  MCPClient,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { callSystemTool, validateToolResponse } from "../tool";

describe("tool utilities", () => {
  describe("validateToolResponse", () => {
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
      expect(validateToolResponse(message)).toBe(true);
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
      expect(validateToolResponse(message)).toBe(true);
    });

    it("should ignore resource content types", () => {
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
      expect(validateToolResponse(message)).toBe(true);
    });

    it("should return true for image content", () => {
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
      expect(validateToolResponse(message)).toBe(true);
    });
  });

  describe("callSystemTool", () => {
    const mockCallTool = jest.fn();
    const mockSystemTools: McpToolRegistry = {
      mcpToolSources: {
        testTool: {
          client: {
            callTool: mockCallTool,
          } as unknown as MCPClient,
          serverKey: "test",
        },
      },
      mcpToolsSchema: [],
      mcpHandlers: {
        elicitation: jest.fn(),
        sampling: jest.fn(),
      },
    };

    const toolCallRequest = {
      toolName: "testTool",
      parameters: [
        { parameterName: "param1", parameterValue: "value1" },
        { parameterName: "param2", parameterValue: "value2" },
      ],
    };

    const componentDecision: LegacyComponentDecision = {
      message: "test message",
      componentName: "TestComponent",
      props: {},
      componentState: {},
      reasoning: ["test reasoning"],
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
      mockCallTool.mockResolvedValue({
        content: [{ type: ContentPartType.Text, text: mockResult }],
      });

      const result = await callSystemTool(
        mockSystemTools,
        toolCallRequest,
        "tool-call-1",
        "tool-call-msg-1",
        componentDecision,
        advanceRequestDto,
      );

      expect(mockCallTool).toHaveBeenCalledWith(
        "testTool",
        {
          param1: "value1",
          param2: "value2",
        },
        { "tambo.co/parentMessageId": "tool-call-msg-1" },
      );

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
      mockCallTool.mockResolvedValue(mockResult);

      const result = await callSystemTool(
        mockSystemTools,
        toolCallRequest,
        "tool-call-1",
        "tool-call-msg-1",
        componentDecision,
        advanceRequestDto,
      );

      expect(result.messageToAppend.content).toEqual(mockResult.content);
    });

    it("should throw error when no response content", async () => {
      const mockResult = { content: [] };
      mockCallTool.mockResolvedValue(mockResult);

      await expect(
        callSystemTool(
          mockSystemTools,
          toolCallRequest,
          "tool-call-1",
          "tool-call-msg-1",
          componentDecision,
          advanceRequestDto,
        ),
      ).rejects.toThrow("No response content found");
    });

    it("unprefixes tool name before invoking MCP client when prefixed", async () => {
      const mockCallPrefixed = jest.fn();
      const serverKey = "svc";
      const baseToolName = "search";
      const toolName = prefixToolName(serverKey, baseToolName);
      const prefixedSystemTools: McpToolRegistry = {
        mcpToolSources: {
          [toolName]: {
            client: {
              callTool: mockCallPrefixed,
            } as unknown as MCPClient,
            serverKey,
          },
        },
        mcpToolsSchema: [],
        mcpHandlers: {
          elicitation: jest.fn(),
          sampling: jest.fn(),
        },
      };

      const resultPayload = {
        content: [{ type: ContentPartType.Text, text: "ok" }],
      };
      mockCallPrefixed.mockResolvedValue(resultPayload);

      await callSystemTool(
        prefixedSystemTools,
        { toolName, parameters: [] as any },
        "id-1",
        "msg-1",
        {
          message: "",
          componentName: "X",
          props: {},
          componentState: {},
          reasoning: [],
        },
        {
          messageToAppend: { role: MessageRole.Tool, content: [] },
          availableComponents: [],
        },
      );

      // Should strip the `svc__` prefix and call underlying tool name "search"
      expect(mockCallPrefixed).toHaveBeenCalledWith(
        baseToolName,
        {},
        { "tambo.co/parentMessageId": "msg-1" },
      );
    });
  });
});
