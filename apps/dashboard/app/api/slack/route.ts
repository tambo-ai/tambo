import { NextResponse } from "next/server";
import { CreateSlackChannelSchema } from "@/lib/types/slack";
import { createSlackChannel } from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = CreateSlackChannelSchema.safeParse(body);
    if (!result.success) {
      console.warn("Invalid input validation:", result.error.format());
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 },
      );
    }

    const { companyName, email } = result.data;

    const channelResult = await createSlackChannel(companyName, email);

    const response = {
      success: true,
      data: {
        channelId: channelResult.channelId,
        channelName: channelResult.channelName,
        inviteLink: channelResult.inviteLink,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Slack API error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isUserFacingError = Boolean(errorMessage);

    return NextResponse.json(
      {
        error: isUserFacingError
          ? errorMessage
          : "An unexpected error occurred",
        details:
          error instanceof Error && error.cause ? error.cause : undefined,
        stack:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: isUserFacingError ? 400 : 500 },
    );
  }
}
