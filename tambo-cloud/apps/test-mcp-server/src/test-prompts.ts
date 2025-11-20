import { Prompt } from "@modelcontextprotocol/sdk/types.js";

export const testPrompts: Prompt[] = [
  {
    name: "test_prompt",
    title: "Test Prompt",
    description: "A test prompt",
    arguments: [
      {
        name: "test_arg",
        description: "A test argument",
        required: true,
      },
    ],
  },
];
