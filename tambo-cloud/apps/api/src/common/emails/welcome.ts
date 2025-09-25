import { Email, WelcomeEmailVariables } from "./types";

export const welcomeEmail: Email<WelcomeEmailVariables> = {
  subject: "Anything I can help with?",
  html: (variables) => {
    // Handle empty firstname - use "there" as fallback
    const displayName = variables.firstName?.trim() || "there";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0">
<pre style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #000; white-space: pre-wrap; word-wrap: break-word; margin: 0; padding: 0;">
Hey ${displayName}!

Just wanted to say thank you for signing up to tambo-ai.

I'm curious-- how did you hear about us? Also are you just looking around or do you have a specific use case I can help you with?

Whatever the reason, anything you need I'm here to help.

Michael
Co-Founder, tambo

Oh, and join our <a href="https://tambo.co/discord" style="color: #0066cc; text-decoration: underline;">discord</a> community to connect with us and other users.
</pre>
  </body>
</html>`;
  },
};
