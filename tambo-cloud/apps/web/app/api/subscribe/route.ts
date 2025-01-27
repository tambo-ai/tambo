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
      from: "Hydra AI <onboarding@hydra.ai>",
      to: email,
      subject: "Welcome to Hydra AI Early Access",
      html: `
        <h1>Welcome to Hydra AI!</h1>
        <p>Thanks for joining our early access list. We'll keep you updated on our latest developments.</p>
        <p>Best,<br>The Hydra AI Team</p>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
