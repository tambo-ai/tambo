import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolResult,
  CreateMessageResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

//type CreateMessageResult = Awaited<ReturnType<Server["createMessage"]>>;
// Test tool definitions
export const testTools: Tool[] = [
  {
    name: "ask_user_for_choice",
    description:
      "Ask the user to choose among a list of string options using MCP elicitation",
    inputSchema: {
      type: "object",
      properties: {
        choices: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Array of string choices for the user to select from",
        },
        prompt: {
          type: "string",
          description: "Optional prompt message to display to the user",
          default: "Please choose from the following options:",
        },
      },
      required: ["choices"],
    },
  },
  {
    name: "emojify_via_llm",
    description:
      "Send a message to the caller's LLM using MCP sampling to transform it into emojis",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to send to the LLM",
        },
      },
      required: ["message"],
    },
  },
];

// Test tool handlers
export const testHandlers = {
  ask_user_for_choice: async (
    args: unknown,
    _meta: Record<string, unknown> | undefined,
    server: Server,
  ): Promise<CallToolResult> => {
    try {
      const { choices, prompt = "Please choose from the following options:" } =
        args as {
          choices: string[];
          prompt?: string;
        };

      if (!choices.length || !Array.isArray(choices) || choices.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Error: choices must be a non-empty array of strings",
            },
          ],
          isError: true,
        };
      }

      console.log("Eliciting input", prompt);

      const response = await server.elicitInput({
        _meta,
        message: prompt,
        requestedSchema: {
          type: "object",
          properties: {
            choice: { type: "string", enum: choices },
          },
          required: ["choice"],
        },
      });
      console.log("Elicitation response", response);

      // Format the choices for display
      const choicesText = choices.map((choice) => `- ${choice}`).join("\n");

      // Return the elicitation request
      return {
        content: [
          {
            type: "text",
            text: `${prompt}\n\n${choicesText}\n\nPlease respond with your choice exactly as written.`,
          },
        ],
        // Note: In a real implementation, this would trigger MCP elicitation
        // For now, we'll return the formatted prompt
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in ask_user_for_choice: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },

  emojify_via_llm: async (
    args: unknown,
    _meta: Record<string, unknown> | undefined,
    server: Server,
  ): Promise<CallToolResult> => {
    try {
      const { message } = args as {
        message: string;
      };

      if (!message || typeof message !== "string") {
        return {
          content: [
            {
              type: "text",
              text: "Error: message must be a non-empty string",
            },
          ],
          isError: true,
        };
      }
      const response = await server.createMessage({
        _meta,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `You are a helpful assistant that transforms messages into emojis.
Whatever the user sends you, attempt to transform it into emojis. 

If there are specific words or phrases cannot be transformed into emojis, leave them as is.

Return only the transformed message, no additional text.`,
            },
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: `Ok, got it!`,
            },
          },
          {
            role: "user",
            content: { type: "text", text: message },
          },
        ],
        maxTokens: 1000,
      });

      // In a real implementation, this would use MCP sampling to call the LLM
      // For now, we'll return a mock response

      return {
        content: toTextContentArray(response.content),
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error in emojify_via_llm: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
};

function toTextContentArray(
  content: CreateMessageResult["content"],
): CallToolResult["content"] {
  switch (content.type) {
    case "text":
      return [{ type: "text", text: content.text }];
    case "image":
      return [
        { type: "image", mimeType: content.mimeType, data: content.data },
      ];
    case "audio":
      return [
        { type: "audio", mimeType: content.mimeType, data: content.data },
      ];
    default:
      throw new Error(`Unknown content type: ${content}`);
  }
}
