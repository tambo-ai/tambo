import { Email, FirstMessageEmailVariables } from "./types";

export const firstMessageEmail: Email<FirstMessageEmailVariables> = {
  subject: "Nice work sending your first message! 🎉",
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

Awesome - you just sent your first message in ${variables.projectName}! 🎉

Since you're getting the hang of it, here are some things you can explore next:

• <a href="https://ui.tambo.co/" style="color: #0066cc; text-decoration: underline;">Try tambo Components</a> - Try <code>npx tambo add "component-name"</code> to get tambo integrated components
• <a href="https://docs.tambo.co/concepts/tools" style="color: #0066cc; text-decoration: underline;">Register Tools</a> - Register tools in your project
• <a href="https://docs.tambo.co/concepts/model-context-protocol" style="color: #0066cc; text-decoration: underline;">Use MCP Servers</a> - Connect to databases, APIs, and more without writing custom tools

Questions? Just reply to this email or hop into our <a href="https://tambo.co/discord" style="color: #0066cc; text-decoration: underline;">Discord</a> - we're always around to help.

Happy building!

Michael
Co-Founder, tambo
</pre>
  </body>
</html>`;
  },
};
