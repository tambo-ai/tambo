import { env } from "@/lib/env";
import { validate } from "deep-email-validator";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Define the expected request body shape
interface FounderEmailRequest {
  subject: string;
  body: string;
  usersEmail: string;
}

// The email address where founder emails should be sent
// Ideally this would be in your environment variables
const FOUNDER_EMAIL = "magan@tambo.co";

export async function POST(req: Request) {
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY environment variable is not set");
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set" },
      { status: 500 },
    );
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);

    // Parse the request body
    let parsedBody;
    try {
      parsedBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { subject, body, usersEmail } = parsedBody as FounderEmailRequest;

    // Validate required fields
    if (!subject || !body || !usersEmail) {
      const missingFields = [];
      if (!subject) missingFields.push("subject");
      if (!body) missingFields.push("body");
      if (!usersEmail) missingFields.push("usersEmail");

      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: "Missing required fields", fields: missingFields },
        { status: 400 },
      );
    }

    // Validate user's email with custom validation options
    console.log("Validating user email:", usersEmail);
    const userEmailValidation = await validate({
      email: usersEmail,
      validateTypo: false, // Disable typo checking
      validateSMTP: true,
      validateMx: true,
      validateDisposable: true,
    });

    if (!userEmailValidation.valid) {
      console.error("User email validation failed:", {
        email: usersEmail,
        reason: userEmailValidation.reason,
        validators: userEmailValidation.validators,
      });

      return NextResponse.json(
        {
          error: "Invalid email address",
          message:
            userEmailValidation.reason === "smtp"
              ? "We couldn't verify if this email can receive messages. Please double-check the address."
              : userEmailValidation.reason === "disposable"
                ? "Please use your regular email address instead of a temporary one."
                : userEmailValidation.reason === "mx"
                  ? "The email domain appears to be invalid or cannot receive emails."
                  : "Please check your email address and try again.",
          details: {
            reason: userEmailValidation.reason,
            technical_details: userEmailValidation.validators,
          },
        },
        { status: 400 },
      );
    }

    // Send the email to founders
    console.log("Attempting to send email via Resend");
    const data = await resend.emails.send({
      from: "Tambo Demo <noreply@updates.tambo.co>",
      to: FOUNDER_EMAIL,
      cc: usersEmail,
      replyTo: usersEmail,
      subject: `[Tambo Demo] ${subject}`,
      html: `
        <div>
          ${body.replace(/\n/g, "<br />")}
        </div>
        <hr>
        <p>This email was sent from ${usersEmail}</p>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Enhanced error logging
    console.error("Detailed error in send-founder-email:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : error,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
