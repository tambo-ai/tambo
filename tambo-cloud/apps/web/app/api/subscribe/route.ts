import { env } from "@/lib/env";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  if (!env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set" },
      { status: 500 },
    );
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);

    const { email } = await req.json();

    const data = await resend.emails.send({
      from: "Tambo AI <magan@tambo.co>",
      to: email,
      subject: "Welcome to Tambo AI Early Access",
      html: `
        <h1>Welcome to Tambo AI!</h1>
        <p>Thanks for joining our early access list. We'll keep you updated on our latest developments.</p>
        <p>Best,<br>The Tambo AI Team</p>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
