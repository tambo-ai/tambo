import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const model = (formData.get("model") as string) || "gpt-4o-mini-transcribe";
    const responseFormat =
      (formData.get("response_format") as string) || "json";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Get OpenAI API key from environment variables
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    // Create FormData to send to OpenAI
    const openAIFormData = new FormData();
    openAIFormData.append("file", audioFile);
    openAIFormData.append("model", model);
    openAIFormData.append("response_format", responseFormat);

    // Call OpenAI Whisper API
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
        },
        body: openAIFormData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: response.status },
      );
    }

    // Get the transcription result
    const result = await response.json();

    // Return the transcribed text
    return NextResponse.json({
      text: result.text || "",
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
