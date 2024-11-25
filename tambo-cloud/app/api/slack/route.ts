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
        { status: 400 }
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

    const userFacingErrors = {
      "Invalid email format": "Please use your company email address",
      "Email domain not allowed": "Please use your company email address",
      "Channel already exists": "A channel for your company already exists",
      "Company name results in invalid channel name":
        "Please modify your company name to make it more unique - it may contain invalid characters or be too similar to an existing name",
    };

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const userFriendlyMessage =
      userFacingErrors[errorMessage as keyof typeof userFacingErrors];
    const isUserFacingError = Boolean(userFriendlyMessage);

    return NextResponse.json(
      {
        error: isUserFacingError
          ? userFriendlyMessage
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
      { status: isUserFacingError ? 400 : 500 }
    );
  }
}
