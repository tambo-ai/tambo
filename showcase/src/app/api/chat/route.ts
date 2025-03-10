import Groq from "groq-sdk/index.mjs";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await groq.chat.completions.create({
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      model: "llama-3.2-90b-vision-preview",
      stream: true,
    });

    return new Response(completion.toReadableStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}