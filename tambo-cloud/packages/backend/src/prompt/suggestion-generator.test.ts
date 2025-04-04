import {
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { AvailableComponent } from "../model/component-metadata";
import { buildSuggestionPrompt } from "./suggestion-generator";

describe("suggestion-generator", () => {
  const mockComponents: AvailableComponent[] = [
    {
      name: "Button",
      description: "A simple button component",
      props: {
        label: "string",
        onClick: "(event: MouseEvent) => void",
      },
      contextTools: [],
    },
    {
      name: "Input",
      description: "An input field component",
      props: {
        value: {
          type: "string",
          description: "Current input value",
          required: true,
        },
        onChange: {
          type: "(value: string) => void",
          description: "Change handler",
          required: true,
        },
      },
      contextTools: [],
    },
  ];

  describe("buildSuggestionPrompt", () => {
    it("should generate prompt with no conversation history", () => {
      const result = buildSuggestionPrompt(mockComponents, [], 3);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("system");
      expect(result[1].role).toBe("user");

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": "Review the available components and conversation history to generate natural follow-up messages that a user might send.

        You may use only the following components:

        - componentName: "Button":
            description: A simple button component
            props:
            {
              "label": "string",
              "onClick": "(event: MouseEvent) => void"
            }

        - componentName: "Input":
            description: An input field component
            props:
            {
              "value": {
                "type": "string",
                "description": "Current input value",
                "required": true
              },
              "onChange": {
                "type": "(value: string) => void",
                "description": "Change handler",
                "required": true
              }
            }

        Your task is to suggest 3 messages written exactly as if they came from the user. These suggestions should represent natural follow-up requests based on the available components and context.

        Rules:
        1. Write each suggestion as a complete message that could be sent by the user
        2. Focus on practical requests that use the available components
        3. Make suggestions contextually relevant to the conversation and previous actions
        4. If a component is currently in use, suggest natural variations or new ways to use it
        5. Write in a natural, conversational tone as if the user is typing
        6. Avoid technical language or system-focused phrasing",
            "role": "system",
          },
          {
            "content": "No conversation history yet.

        Generate 3 natural follow-up messages that a user might send. Each suggestion should be a complete message that could be sent directly to the system.

        The suggestions should be written exactly as a user would type them, not as descriptions or commands, in a JSON structure.
        ",
            "role": "user",
          },
        ]
      `);
    });

    it("should include conversation history when available", () => {
      const mockHistory: ThreadMessage[] = [
        {
          role: MessageRole.User,
          content: [{ type: "text", text: "Show me a button" }],
          id: "1",
          threadId: "thread-1",
          componentState: {},
          createdAt: new Date("2024-01-01T00:00:00.000Z"), // Fixed date for snapshot
        },
        {
          role: MessageRole.Assistant,
          content: [{ type: "text", text: "Here's your button" }],
          id: "2",
          threadId: "thread-1",
          componentState: {},
          createdAt: new Date("2024-01-01T00:00:01.000Z"), // Fixed date for snapshot
        },
      ];

      const result = buildSuggestionPrompt(mockComponents, mockHistory, 2);

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": "Review the available components and conversation history to generate natural follow-up messages that a user might send.

        You may use only the following components:

        - componentName: "Button":
            description: A simple button component
            props:
            {
              "label": "string",
              "onClick": "(event: MouseEvent) => void"
            }

        - componentName: "Input":
            description: An input field component
            props:
            {
              "value": {
                "type": "string",
                "description": "Current input value",
                "required": true
              },
              "onChange": {
                "type": "(value: string) => void",
                "description": "Change handler",
                "required": true
              }
            }

        Your task is to suggest 2 messages written exactly as if they came from the user. These suggestions should represent natural follow-up requests based on the available components and context.

        Rules:
        1. Write each suggestion as a complete message that could be sent by the user
        2. Focus on practical requests that use the available components
        3. Make suggestions contextually relevant to the conversation and previous actions
        4. If a component is currently in use, suggest natural variations or new ways to use it
        5. Write in a natural, conversational tone as if the user is typing
        6. Avoid technical language or system-focused phrasing",
            "role": "system",
          },
          {
            "content": "Recent conversation context:
        user: Show me a button
        assistant: Here's your button

        No component currently in use.

        Generate 2 natural follow-up messages that a user might send. Each suggestion should be a complete message that could be sent directly to the system.

        The suggestions should be written exactly as a user would type them, not as descriptions or commands, in a JSON structure.
        ",
            "role": "user",
          },
        ]
      `);
    });

    it("should handle current component context", () => {
      const componentDecision: LegacyComponentDecision = {
        componentName: "Button",
        props: { label: "Click me" },
        message: "Using button component",
        componentState: {},
        reasoning: "Button requested by user",
        suggestedActions: [],
      };

      const mockHistory: ThreadMessage[] = [
        {
          role: MessageRole.User,
          content: [{ type: "text", text: "Show me a button" }],
          id: "1",
          threadId: "thread-1",
          componentState: {},
          createdAt: new Date("2024-01-01T00:00:00.000Z"), // Fixed date for snapshot
          component: componentDecision,
        },
      ];

      const result = buildSuggestionPrompt(mockComponents, mockHistory, 2);

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": "Review the available components and conversation history to generate natural follow-up messages that a user might send.

        You may use only the following components:

        - componentName: "Button":
            description: A simple button component
            props:
            {
              "label": "string",
              "onClick": "(event: MouseEvent) => void"
            }

        - componentName: "Input":
            description: An input field component
            props:
            {
              "value": {
                "type": "string",
                "description": "Current input value",
                "required": true
              },
              "onChange": {
                "type": "(value: string) => void",
                "description": "Change handler",
                "required": true
              }
            }

        Your task is to suggest 2 messages written exactly as if they came from the user. These suggestions should represent natural follow-up requests based on the available components and context.

        Rules:
        1. Write each suggestion as a complete message that could be sent by the user
        2. Focus on practical requests that use the available components
        3. Make suggestions contextually relevant to the conversation and previous actions
        4. If a component is currently in use, suggest natural variations or new ways to use it
        5. Write in a natural, conversational tone as if the user is typing
        6. Avoid technical language or system-focused phrasing",
            "role": "system",
          },
          {
            "content": "Recent conversation context:
        user: Show me a button

        Current component: Button
        Current props: {
          "label": "Click me"
        }

        Generate 2 natural follow-up messages that a user might send. Each suggestion should be a complete message that could be sent directly to the system.

        The suggestions should be written exactly as a user would type them, not as descriptions or commands, in a JSON structure.
        ",
            "role": "user",
          },
        ]
      `);
    });

    it("should handle empty component list", () => {
      const result = buildSuggestionPrompt([], [], 1);

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": "Review the available components and conversation history to generate natural follow-up messages that a user might send.

        You may use only the following components:
        No components available, do not try and generate a component.

        Your task is to suggest 1 messages written exactly as if they came from the user. These suggestions should represent natural follow-up requests based on the available components and context.

        Rules:
        1. Write each suggestion as a complete message that could be sent by the user
        2. Focus on practical requests that use the available components
        3. Make suggestions contextually relevant to the conversation and previous actions
        4. If a component is currently in use, suggest natural variations or new ways to use it
        5. Write in a natural, conversational tone as if the user is typing
        6. Avoid technical language or system-focused phrasing",
            "role": "system",
          },
          {
            "content": "No conversation history yet.

        Generate 1 natural follow-up messages that a user might send. Each suggestion should be a complete message that could be sent directly to the system.

        The suggestions should be written exactly as a user would type them, not as descriptions or commands, in a JSON structure.
        ",
            "role": "user",
          },
        ]
      `);
    });

    it("should include correct number of suggestions in prompt", () => {
      const counts = [1, 3, 5];

      counts.forEach((count) => {
        const result = buildSuggestionPrompt(mockComponents, [], count);
        expect(result).toMatchSnapshot();
      });
    });

    it("should handle component with complex props", () => {
      const complexComponent: AvailableComponent[] = [
        {
          name: "ComplexForm",
          description: "A form with nested props",
          props: {
            formData: {
              type: "object",
              description: "Form data object",
              required: true,
            },
            validation: {
              type: "{ rules: object; messages: object }",
              description: "Validation configuration",
            },
          },
          contextTools: [],
        },
      ];

      const result = buildSuggestionPrompt(complexComponent, [], 1);

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": "Review the available components and conversation history to generate natural follow-up messages that a user might send.

        You may use only the following components:

        - componentName: "ComplexForm":
            description: A form with nested props
            props:
            {
              "formData": {
                "type": "object",
                "description": "Form data object",
                "required": true
              },
              "validation": {
                "type": "{ rules: object; messages: object }",
                "description": "Validation configuration"
              }
            }

        Your task is to suggest 1 messages written exactly as if they came from the user. These suggestions should represent natural follow-up requests based on the available components and context.

        Rules:
        1. Write each suggestion as a complete message that could be sent by the user
        2. Focus on practical requests that use the available components
        3. Make suggestions contextually relevant to the conversation and previous actions
        4. If a component is currently in use, suggest natural variations or new ways to use it
        5. Write in a natural, conversational tone as if the user is typing
        6. Avoid technical language or system-focused phrasing",
            "role": "system",
          },
          {
            "content": "No conversation history yet.

        Generate 1 natural follow-up messages that a user might send. Each suggestion should be a complete message that could be sent directly to the system.

        The suggestions should be written exactly as a user would type them, not as descriptions or commands, in a JSON structure.
        ",
            "role": "user",
          },
        ]
      `);
    });

    it("should preserve most recent component context", () => {
      const buttonDecision: LegacyComponentDecision = {
        componentName: "Button",
        props: { label: "First" },
        message: "Using button component",
        componentState: {},
        reasoning: "Button requested by user",
        suggestedActions: [],
      };

      const inputDecision: LegacyComponentDecision = {
        componentName: "Input",
        props: { value: "Latest" },
        message: "Using input component",
        componentState: {},
        reasoning: "Input requested by user",
        suggestedActions: [],
      };

      const mockHistory: ThreadMessage[] = [
        {
          role: MessageRole.User,
          content: [{ type: "text", text: "Show button" }],
          id: "1",
          threadId: "thread-1",
          componentState: {},
          createdAt: new Date("2024-01-01T00:00:00.000Z"), // Fixed date for snapshot
          component: buttonDecision,
        },
        {
          role: MessageRole.User,
          content: [{ type: "text", text: "Show input" }],
          id: "2",
          threadId: "thread-1",
          componentState: {},
          createdAt: new Date("2024-01-01T00:00:01.000Z"), // Fixed date for snapshot
          component: inputDecision,
        },
      ];

      const result = buildSuggestionPrompt(mockComponents, mockHistory, 1);

      expect(result).toMatchInlineSnapshot(`
        [
          {
            "content": "Review the available components and conversation history to generate natural follow-up messages that a user might send.

        You may use only the following components:

        - componentName: "Button":
            description: A simple button component
            props:
            {
              "label": "string",
              "onClick": "(event: MouseEvent) => void"
            }

        - componentName: "Input":
            description: An input field component
            props:
            {
              "value": {
                "type": "string",
                "description": "Current input value",
                "required": true
              },
              "onChange": {
                "type": "(value: string) => void",
                "description": "Change handler",
                "required": true
              }
            }

        Your task is to suggest 1 messages written exactly as if they came from the user. These suggestions should represent natural follow-up requests based on the available components and context.

        Rules:
        1. Write each suggestion as a complete message that could be sent by the user
        2. Focus on practical requests that use the available components
        3. Make suggestions contextually relevant to the conversation and previous actions
        4. If a component is currently in use, suggest natural variations or new ways to use it
        5. Write in a natural, conversational tone as if the user is typing
        6. Avoid technical language or system-focused phrasing",
            "role": "system",
          },
          {
            "content": "Recent conversation context:
        user: Show button
        user: Show input

        Current component: Input
        Current props: {
          "value": "Latest"
        }

        Generate 1 natural follow-up messages that a user might send. Each suggestion should be a complete message that could be sent directly to the system.

        The suggestions should be written exactly as a user would type them, not as descriptions or commands, in a JSON structure.
        ",
            "role": "user",
          },
        ]
      `);
    });
  });
});
