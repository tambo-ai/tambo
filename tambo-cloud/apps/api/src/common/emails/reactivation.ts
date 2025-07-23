import { Email, ReactivationEmailVariables } from "./types";

export const reactivationEmail: Email<ReactivationEmailVariables> = {
  subject: "Quick check-in from Michael at tambo 👋",
  html: (variables) => {
    // Handle empty firstname - use "there" as fallback
    const displayName = variables.firstName?.trim() || "there";
    const dayText = variables.daysSinceSignup === 1 ? "day" : "days";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0">
<pre style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #000; white-space: pre-wrap; word-wrap: break-word; margin: 0; padding: 0;">
Hey ${displayName},

Michael here, co-founder of tambo. I noticed you signed up ${variables.daysSinceSignup} ${dayText} ago${variables.hasProject ? " and created a project" : ""}, but haven't ${variables.hasProject ? "been active recently" : "set up your first project yet"}.

I wanted to personally reach out and see if there's anything I can help with? 

Sometimes getting started can feel overwhelming, so I'd be happy to:
• Walk you through the setup process
• Help you understand which features would work best for your use case
• Answer any questions you might have
• Jump on a quick 15-minute onboarding call

Just reply to this email or <a href="${process.env.CALENDAR_URL}" style="color: #0066cc; text-decoration: underline;">book a time that works for you</a>.

No pressure at all - I know how busy things get. But if you're still interested in using tambo, I'm here to make sure you have a great experience.

Best,
Michael
Co-Founder, tambo

P.S. If you're no longer interested, no worries at all! Just let me know and I'll make sure we don't send any more emails.
</pre>
  </body>
</html>`;
  },
};
