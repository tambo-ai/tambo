import {
  ChatCompletionContentPartText,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { threadMessagesToChatCompletionMessageParam } from "./thread-message-conversion";

const baseThreadMessage = {
  threadId: "test-thread",
  componentState: {},
  createdAt: new Date(),
  severity: 0,
};

describe("threadMessagesToChatHistory", () => {
  describe("tool messages", () => {
    it("should convert tool message with tool_call_id correctly", () => {
      const toolMessage: ThreadMessage = {
        ...baseThreadMessage,
        id: "1",
        role: MessageRole.Tool,
        content: [
          { type: "text", text: "tool response" },
        ] as ChatCompletionContentPartText[],
        tool_call_id: "test-tool-call-1",
      };

      const result = threadMessagesToChatCompletionMessageParam([toolMessage]);

      expect(result).toEqual([
        {
          role: "tool",
          content: [{ type: "text", text: "tool response" }],
          tool_call_id: "test-tool-call-1",
        },
      ]);
    });

    it("should convert tool message without tool_call_id to user message", () => {
      const toolMessage: ThreadMessage = {
        ...baseThreadMessage,
        id: "1",
        role: MessageRole.Tool,
        content: [
          { type: "text", text: "tool response" },
        ] as ChatCompletionContentPartText[],
      };

      const result = threadMessagesToChatCompletionMessageParam([toolMessage]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: "user",
        content: [{ type: "text", text: "tool response" }],
      });
    });
    it("should handle tool calls without responses", () => {
      const assistantMessage: ThreadMessage = {
        ...baseThreadMessage,
        id: "1",
        role: MessageRole.Assistant,
        tool_call_id: "test-tool-1",
        toolCallRequest: {
          toolName: "test_tool",
          parameters: [{ parameterName: "param1", parameterValue: "value1" }],
        },
        content: [{ type: "text", text: "assistant message" }],
      };

      const result = threadMessagesToChatCompletionMessageParam([
        assistantMessage,
      ]);

      // "text" should have a json object in it
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": [
              {
                "text": "[{"id":"test-tool-1","type":"function","function":{"name":"test_tool","arguments":"{\\"param1\\":\\"value1\\"}"}}]",
                "type": "text",
              },
            ],
            "role": "assistant",
          },
        ]
      `);
    });
  });

  describe("assistant messages", () => {
    it("should handle assistant message with tool call and component", () => {
      const componentDecision: LegacyComponentDecision = {
        componentName: "TestComponent",
        message: "test reasoning",
        props: {},
        componentState: {},
        reasoning: "test reasoning",
      };

      const toolCallRequest: ToolCallRequest = {
        tool_call_id: "test-tool-1",
        toolName: "test_tool",
        parameters: [{ parameterName: "param1", parameterValue: "value1" }],
      };
      const toolMessage: ThreadMessage = {
        ...baseThreadMessage,
        id: "1",
        role: MessageRole.Tool,
        content: [{ type: "text", text: "tool response" }],
        tool_call_id: "test-tool-1",
      };

      const assistantMessage: ThreadMessage = {
        ...baseThreadMessage,
        id: "1",
        role: MessageRole.Assistant,
        tool_call_id: "test-tool-1",
        content: [{ type: "text", text: "assistant message" }],
        component: {
          ...componentDecision,
          toolCallRequest,
        },
        componentState: { state: "test" },
      };

      const result = threadMessagesToChatCompletionMessageParam([
        assistantMessage,
        toolMessage,
      ]);

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": [
              {
                "text": "{"componentName":"TestComponent","message":"test reasoning","props":{},"componentState":{"instructions":"\\nThe following values represent the current internal state of the component attached to this message. These values may have been updated by the user.","state":"test"},"reasoning":"test reasoning","toolCallRequest":{"tool_call_id":"test-tool-1","toolName":"test_tool","parameters":[{"parameterName":"param1","parameterValue":"value1"}]}}",
                "type": "text",
              },
            ],
            "role": "assistant",
            "tool_calls": [
              {
                "function": {
                  "arguments": "{"reasoning":"test reasoning","decision":true,"component":"TestComponent"}",
                  "name": "decide_component",
                },
                "id": "test-tool-1-cc",
                "type": "function",
              },
            ],
          },
          {
            "content": [
              {
                "text": "{}",
                "type": "text",
              },
            ],
            "role": "tool",
            "tool_call_id": "test-tool-1-cc",
          },
          {
            "content": "Now fetch some data",
            "role": "assistant",
            "tool_calls": [
              {
                "function": {
                  "arguments": "{"param1":"value1"}",
                  "name": "test_tool",
                },
                "id": "test-tool-1",
                "type": "function",
              },
            ],
          },
          {
            "content": [
              {
                "text": "tool response",
                "type": "text",
              },
            ],
            "role": "tool",
            "tool_call_id": "test-tool-1",
          },
        ]
      `);
    });

    it("should handle simple assistant message", () => {
      const assistantMessage: ThreadMessage = {
        ...baseThreadMessage,
        id: "1",
        role: MessageRole.Assistant,
        content: [
          { type: "text", text: "simple response" },
        ] as ChatCompletionContentPartText[],
      };

      const result = threadMessagesToChatCompletionMessageParam([
        assistantMessage,
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: "assistant",
        content: [{ type: "text", text: "simple response" }],
      });
    });
  });

  describe("user messages", () => {
    it("should handle user message with additional context", () => {
      const userMessage: ThreadMessage = {
        ...baseThreadMessage,
        id: "1",
        role: MessageRole.User,
        content: [
          { type: "text", text: "user input" },
        ] as ChatCompletionContentPartText[],
        additionalContext: { extra: "context" },
      };

      const result = threadMessagesToChatCompletionMessageParam([userMessage]);
      expect(result).toEqual([
        {
          role: "user",
          content: [
            {
              text: '<AdditionalContext> The following is additional context provided by the system that you can use when responding to the user: {"extra":"context"} </AdditionalContext>\n\n',
              type: "text",
            },
            { type: "text", text: "<User>" },
            { type: "text", text: "user input" },
            { type: "text", text: "</User>" },
          ],
        },
      ]);
    });

    it("should handle system message", () => {
      const systemMessage: ThreadMessage = {
        ...baseThreadMessage,
        id: "1",
        role: MessageRole.System,
        content: [
          { type: "text", text: "system instruction" },
        ] as ChatCompletionContentPartText[],
      };

      const result = threadMessagesToChatCompletionMessageParam([
        systemMessage,
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: "system",
        content: [{ type: "text", text: "system instruction" }],
      });
    });
  });

  describe("complex scenarios", () => {
    it("should handle a sequence of messages with tool calls and responses", () => {
      const messages: ThreadMessage[] = [
        {
          ...baseThreadMessage,
          id: "1",
          role: MessageRole.User,
          content: [
            { type: "text", text: "user request" },
          ] as ChatCompletionContentPartText[],
        },
        {
          ...baseThreadMessage,
          id: "2",
          role: MessageRole.Assistant,
          content: [{ type: "text", text: "assistant response" }],
          tool_call_id: "tool-1",
          toolCallRequest: {
            toolName: "test_tool",
            parameters: [{ parameterName: "param", parameterValue: "value" }],
          },
        },
        {
          ...baseThreadMessage,
          id: "3",
          role: MessageRole.Tool,
          tool_call_id: "tool-1",
          content: [
            { type: "text", text: "tool response" },
          ] as ChatCompletionContentPartText[],
        },
      ];

      const result = threadMessagesToChatCompletionMessageParam(messages);

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": [
              {
                "text": "<User>",
                "type": "text",
              },
              {
                "text": "user request",
                "type": "text",
              },
              {
                "text": "</User>",
                "type": "text",
              },
            ],
            "role": "user",
          },
          {
            "content": [
              {
                "text": "assistant response",
                "type": "text",
              },
            ],
            "role": "assistant",
            "tool_calls": undefined,
          },
          {
            "content": [
              {
                "text": "tool response",
                "type": "text",
              },
            ],
            "role": "tool",
            "tool_call_id": "tool-1",
          },
        ]
      `);
    });
  });
});
