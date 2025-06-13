import { type McpService } from "./mcp-service.js";

// Example service with simple tools to demonstrate extensibility
export const exampleService: McpService = {
  name: "example",
  tools: [
    {
      name: "echo",
      description: "Echo back the provided text",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to echo back",
          },
        },
        required: ["text"],
      },
    },
    {
      name: "add-numbers",
      description: "Add two numbers together",
      inputSchema: {
        type: "object",
        properties: {
          a: {
            type: "number",
            description: "First number",
          },
          b: {
            type: "number",
            description: "Second number",
          },
        },
        required: ["a", "b"],
      },
    },
  ],
  handlers: {
    echo: async (args: any) => {
      const { text } = args as { text: string };
      return {
        content: [{ type: "text", text: `Echo: ${text}` }],
      };
    },
    "add-numbers": async (args: any) => {
      const { a, b } = args as { a: number; b: number };
      const result = a + b;
      return {
        content: [{ type: "text", text: `${a} + ${b} = ${result}` }],
      };
    },
  },
};

// This service can be easily added to the registry by uncommenting this line in index.ts:
// serviceRegistry.registerService(exampleService);
