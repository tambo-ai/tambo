import OpenAI from "openai";

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Call draw_picture !" }],

    tools: [
      {
        type: "function",
        function: {
          strict: true,
          name: "draw_picture",
          description: "Draw a picture",
          parameters: {
            type: "object",
            additionalProperties: false,
            required: ["title", "age", "tags", "metadata"],
            properties: {
              // String with validation props
              title: {
                type: "string",
              },

              // Number with validation props
              age: {
                type: "number",
              },

              // Array with validation props
              tags: {
                type: "array",
                items: { type: "string" },
              },

              // Object with validation props and nested properties with validation
              metadata: {
                type: "object",
                additionalProperties: false,
                required: ["created", "binary"],
                properties: {
                  created: {
                    type: "string",
                  },
                  binary: {
                    type: "string",
                    contentEncoding: "base64",
                    contentMediaType: "image/png",
                  },
                },
              },
            },
          },
        },
      },
    ],
  });

  console.log(JSON.stringify(response, null, 2));
}

main().catch(console.error);
