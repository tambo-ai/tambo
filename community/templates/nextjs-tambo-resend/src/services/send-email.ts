"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
};

type SendEmailResult =
  | {
      status: "sent";
      to: string;
      id?: string;
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function sendEmail({
  to,
  subject,
  body,
}: SendEmailInput): Promise<SendEmailResult> {

  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
    return {
      status: "error",
      message: "Missing Resend configuration. Check environment variables.",
    };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          line-height: 1.6;
        ">
          ${body
            .split("\n")
            .map((line) => `<p>${line}</p>`)
            .join("")}
        </div>
      `,
    });

    return {
      status: "sent",
      to,
      id: result.data?.id,
      message: `Email successfully sent to ${to}`,
    };
  } catch (error) {
    console.error("Resend error:", error);

    return {
      status: "error",
      message:
        "Failed to send email. Please check your Resend API key and sender email.",
    };
  }
}
