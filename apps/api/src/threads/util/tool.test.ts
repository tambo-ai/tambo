import { McpToolRegistry, prefixToolName } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  LegacyComponentDecision,
  MCPClient,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { callSystemTool, validateToolResponse } from "./tool";

describe("tool utilities", () => {
  describe("validateToolResponse", () => {
    it("should accept JSON text content", () => {
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
        tool_call_id: "test-tool-call-id",
      };
      expect(validateToolResponse(message)).toBe(true);
    });

    it("should accept non-JSON text content", () => {
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
        tool_call_id: "test-tool-call-id",
      };
      expect(validateToolResponse(message)).toBe(true);
    });

    it("should return false when message contains unsupported content types", () => {
      const text = "text response";
      const message: ThreadMessage = {
        id: "1",
        threadId: "1",
        createdAt: new Date(),
        content: [
          {
            type: "unsupported" as any,
            text: "resource",
          },
          {
            type: ContentPartType.Text,
            text,
          },
        ],
        role: MessageRole.Tool,
        tool_call_id: "test-tool-call-id",
      };
      expect(validateToolResponse(message)).toBe(false);
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
        tool_call_id: "test-tool-call-id",
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

    it("should convert resource_link to Resource with prefixed URI", async () => {
      const serverKey = "github";
      const mockCallWithResourceLink = jest.fn();
      const resourceLinkSystemTools: McpToolRegistry = {
        mcpToolSources: {
          resourceTool: {
            client: {
              callTool: mockCallWithResourceLink,
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

      // MCP tool returns a resource_link content type
      mockCallWithResourceLink.mockResolvedValue({
        content: [
          {
            type: "resource_link",
            uri: "file:///project/src/main.rs",
            name: "main.rs",
            description: "Primary application entry point",
            mimeType: "text/x-rust",
          },
        ],
      });

      const result = await callSystemTool(
        resourceLinkSystemTools,
        { toolName: "resourceTool", parameters: [] },
        "tool-call-1",
        "tool-call-msg-1",
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

      // Should convert to Resource with prefixed URI
      expect(result.messageToAppend.content).toEqual([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "github:file:///project/src/main.rs",
            name: "main.rs",
            description: "Primary application entry point",
            mimeType: "text/x-rust",
            annotations: undefined,
          },
        },
      ]);
    });

    it("should convert embedded resource with text content", async () => {
      const serverKey = "linear";
      const mockCallWithEmbeddedResource = jest.fn();
      const embeddedResourceSystemTools: McpToolRegistry = {
        mcpToolSources: {
          embeddedTool: {
            client: {
              callTool: mockCallWithEmbeddedResource,
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

      // MCP tool returns an embedded resource with text content
      mockCallWithEmbeddedResource.mockResolvedValue({
        content: [
          {
            type: "resource",
            resource: {
              uri: "file:///readme.md",
              text: "# Hello World\n\nThis is a readme file.",
              mimeType: "text/markdown",
            },
          },
        ],
      });

      const result = await callSystemTool(
        embeddedResourceSystemTools,
        { toolName: "embeddedTool", parameters: [] },
        "tool-call-1",
        "tool-call-msg-1",
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

      // Should convert to Resource with prefixed URI and inline content
      expect(result.messageToAppend.content).toEqual([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "linear:file:///readme.md",
            text: "# Hello World\n\nThis is a readme file.",
            blob: undefined,
            mimeType: "text/markdown",
          },
        },
      ]);
    });

    it("should handle mixed text and resource_link content", async () => {
      const serverKey = "test";
      const mockCallWithMixedContent = jest.fn();
      const mixedContentSystemTools: McpToolRegistry = {
        mcpToolSources: {
          mixedTool: {
            client: {
              callTool: mockCallWithMixedContent,
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

      // MCP tool returns mixed content
      mockCallWithMixedContent.mockResolvedValue({
        content: [
          { type: "text", text: "Found the following file:" },
          {
            type: "resource_link",
            uri: "file:///main.rs",
            name: "main.rs",
          },
        ],
      });

      const result = await callSystemTool(
        mixedContentSystemTools,
        { toolName: "mixedTool", parameters: [] },
        "tool-call-1",
        "tool-call-msg-1",
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

      expect(result.messageToAppend.content).toHaveLength(2);
      expect(result.messageToAppend.content[0]).toEqual({
        type: ContentPartType.Text,
        text: "Found the following file:",
      });
      expect(result.messageToAppend.content[1]).toEqual({
        type: ContentPartType.Resource,
        resource: {
          uri: "test:file:///main.rs",
          name: "main.rs",
          description: undefined,
          mimeType: undefined,
          annotations: undefined,
        },
      });
    });

    it("should convert image content from MCP tool response", async () => {
      const serverKey = "images";
      const mockCallWithImage = jest.fn();
      const imageSystemTools: McpToolRegistry = {
        mcpToolSources: {
          imageTool: {
            client: {
              callTool: mockCallWithImage,
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

      mockCallWithImage.mockResolvedValue({
        content: [
          {
            type: "image",
            mimeType: "image/png",
            data: "base64imagedata",
          },
        ],
      });

      const result = await callSystemTool(
        imageSystemTools,
        { toolName: "imageTool", parameters: [] },
        "tool-call-1",
        "tool-call-msg-1",
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

      expect(result.messageToAppend.content).toEqual([
        {
          type: ContentPartType.ImageUrl,
          image_url: {
            url: "data:image/png;base64,base64imagedata",
          },
        },
      ]);
    });
  });

  describe("validateToolResponse with resource content", () => {
    it("should accept resource-only messages", () => {
      const message: ThreadMessage = {
        id: "1",
        threadId: "1",
        createdAt: new Date(),
        content: [
          {
            type: ContentPartType.Resource,
            resource: {
              uri: "github:file:///main.rs",
              name: "main.rs",
              text: "fn main() {}",
            },
          },
        ],
        role: MessageRole.Tool,
        tool_call_id: "test-tool-call-id",
      };
      expect(validateToolResponse(message)).toBe(true);
    });

    it("should accept mixed text and resource content", () => {
      const message: ThreadMessage = {
        id: "1",
        threadId: "1",
        createdAt: new Date(),
        content: [
          {
            type: ContentPartType.Text,
            text: "Here is the file:",
          },
          {
            type: ContentPartType.Resource,
            resource: {
              uri: "github:file:///main.rs",
              name: "main.rs",
            },
          },
        ],
        role: MessageRole.Tool,
        tool_call_id: "test-tool-call-id",
      };
      expect(validateToolResponse(message)).toBe(true);
    });

    it("should return false for empty content", () => {
      const message: ThreadMessage = {
        id: "1",
        threadId: "1",
        createdAt: new Date(),
        content: [],
        role: MessageRole.Tool,
        tool_call_id: "test-tool-call-id",
      };
      expect(validateToolResponse(message)).toBe(false);
    });
  });
});
