import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
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
