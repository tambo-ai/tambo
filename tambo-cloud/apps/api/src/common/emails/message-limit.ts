import { Email, MessageLimitEmailVariables } from "./types";

export const messageLimitEmail: Email<MessageLimitEmailVariables> = {
  subject: "tambo ai - Free Message Limit Reached",
  html: (variables) => {
    return `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>tambo ai - Message Limit Notification</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: white;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; width: 100%;">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <img src="https://tambo.co/logo/lockup/Tambo-Lockup.png" alt="tambo" style="width: 150px; height: auto;">
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px;">Message Limit Reached</h1>
                          <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                            You've reached your free message limit of ${variables.messageLimit} messages for your project:
                          </p>
                          <div style="background-color: #F3F4F6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
                            <strong style="color: #111827; font-size: 18px;">${variables.projectName}</strong>
                            <span style="color: #6B7280; font-size: 14px; margin-left: 8px;">(${variables.projectId})</span>
                          </div>
                          <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                            To continue using the service, you have two options:
                          </p>
                          <ol style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 20px; padding-left: 20px;">
                            <li style="margin-bottom: 10px;">
                              Add your own LLM provider (like OpenAI) to your project
                            </li>
                            <li>
                              Contact us at <a href="mailto:support@tambo.co" style="color: #2563eb; text-decoration: underline;">support@tambo.co</a> to discuss enterprise options
                            </li>
                          </ol>
                          <div style="margin: 40px 0;">
                            <a href="https://tambo.co/dashboard/${variables.projectId}"
                               style="background-color: #7FFFC4; color: #023A41; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: block; text-align: center; width: 100%; box-sizing: border-box;">
                              Go to Your Project
                            </a>
                          </div>
                          <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 40px 0 20px;">
                            Thank you for using tambo!
                          </p>
                          <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                            Best regards,<br>
                            The tambo-ai team
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; text-align: center; background-color: #f9fafb;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">
                      Fractal Dynamics Inc © 2024
                    </p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
`;
  },
};
