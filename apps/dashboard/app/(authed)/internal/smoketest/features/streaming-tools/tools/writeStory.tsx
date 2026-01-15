import { defineTool } from "@tambo-ai/react";
import z from "zod";

const getWriteStoryTool = (onToolCall: (text: string) => void) =>
  defineTool({
    name: "writeStory",
    description:
      "Write and display a story or paragraph of text. Use this tool when asked to write text, stories, or paragraphs. The text will be displayed for the user.",
    tool: ({ text }: { text: string }) => {
      onToolCall(text);
      return "Story displayed to user successfully. Do not include the story text in your response.";
    },
    inputSchema: z.object({
      text: z.string().describe("The story or text to display"),
    }),
    outputSchema: z.string().describe("The result of writing the story"),
    annotations: { tamboStreamableHint: true },
  });

export { getWriteStoryTool };
