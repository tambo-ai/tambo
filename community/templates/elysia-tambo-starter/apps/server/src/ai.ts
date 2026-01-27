import { TamboAI } from "@tambo-ai/typescript-sdk/index.js";
import { tools } from "./tools";

// Initialize Tambo client
const client = new TamboAI({
  apiKey: process.env.TAMBO_API_KEY,
});

export const aiHandler = async ({ body, set }: any) => {
  const { messages } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    set.status = 400;
    return { error: "No messages provided" };
  }

  const lastMessage = messages[messages.length - 1];

  try {
    const stream = await client.threads.runs.create({
      message: {
        role: "user",
        content: [
          {
            type: "text",
            text:
              typeof lastMessage.content === "string"
                ? lastMessage.content
                : JSON.stringify(lastMessage.content),
          },
        ],
      },
      model: "gemini-1.5-flash",
      tools: tools,
      toolChoice: "auto",
    });

    return new Response(stream.toReadableStream(), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Error:", error);
    set.status = 500;
    return { error: "Failed to process AI request" };
  }
};
