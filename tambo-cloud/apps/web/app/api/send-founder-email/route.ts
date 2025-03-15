import { env } from "@/lib/env";
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
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set" },
      { status: 500 },
    );
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);

    // Parse the request body
    const { subject, body, usersEmail } =
      (await req.json()) as FounderEmailRequest;

    // Validate required fields
    if (!subject || !body || !usersEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Send the email to founders
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
    console.error("Error sending email to founders:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
