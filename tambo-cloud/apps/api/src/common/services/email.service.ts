import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { FREE_MESSAGE_LIMIT } from "../../threads/types/errors";
import { isResendEmailUnsubscribed, maskEmail } from "@tambo-ai-cloud/core";
import { firstMessageEmail } from "../emails/first-message";
import { messageLimitEmail } from "../emails/message-limit";
import { reactivationEmail } from "../emails/reactivation";
import { welcomeEmail } from "../emails/welcome";

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromEmailDefault: string;
  private readonly fromEmailPersonal: string;
  private readonly replyToSupport: string;
  private readonly replyToPersonal: string;
  private readonly resendAudienceId?: string;

  constructor(private readonly configService: ConfigService) {
    const resendApiKey = this.configService.get<string>("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    this.resend = new Resend(resendApiKey);

    // Load email configuration from environment variables (required)
    this.fromEmailDefault =
      this.configService.get<string>("EMAIL_FROM_DEFAULT")!;
    if (!this.fromEmailDefault) {
      throw new Error("EMAIL_FROM_DEFAULT is not configured");
    }

    this.fromEmailPersonal = this.configService.get<string>(
      "EMAIL_FROM_PERSONAL",
    )!;
    if (!this.fromEmailPersonal) {
      throw new Error("EMAIL_FROM_PERSONAL is not configured");
    }

    this.replyToSupport = this.configService.get<string>(
      "EMAIL_REPLY_TO_SUPPORT",
    )!;
    if (!this.replyToSupport) {
      throw new Error("EMAIL_REPLY_TO_SUPPORT is not configured");
    }

    this.replyToPersonal = this.configService.get<string>(
      "EMAIL_REPLY_TO_PERSONAL",
    )!;
    if (!this.replyToPersonal) {
      throw new Error("EMAIL_REPLY_TO_PERSONAL is not configured");
    }

    // Optional audience for unsubscribe checks
    const audienceId = this.configService.get<string>("RESEND_AUDIENCE_ID");
    this.resendAudienceId = audienceId || undefined;
  }

  /**
   * Best-effort check: returns true if the email appears unsubscribed in Resend audience.
   * Fails closed to false (i.e., do not block) if we cannot determine.
   */
  private async isEmailUnsubscribed(userEmail: string): Promise<boolean> {
    if (!this.resendAudienceId) return false;
    // Helper already handles errors and returns false on failure
    return await isResendEmailUnsubscribed(
      this.resend.contacts,
      this.resendAudienceId,
      userEmail,
    );
  }

  async sendMessageLimitNotification(
    projectId: string,
    userEmail: string,
    projectName: string,
  ) {
    try {
      await this.resend.emails.send({
        from: this.fromEmailDefault,
        to: userEmail,
        replyTo: this.replyToSupport,
        subject: messageLimitEmail.subject,
        html: messageLimitEmail.html({
          projectId,
          projectName,
          messageLimit: FREE_MESSAGE_LIMIT,
        }),
      });
    } catch (error) {
      console.error("Failed to send message limit notification email:", error);
      // Don't throw the error as this is a non-critical operation
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    firstName?: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (await this.isEmailUnsubscribed(userEmail)) {
        // Skip send for unsubscribed recipients; mask PII and keep logs neutral
        console.debug("Welcome email skipped: recipient is unsubscribed", {
          email: maskEmail(userEmail),
        });
        return { success: true };
      }
      const result = await this.resend.emails.send({
        from: this.fromEmailPersonal,
        to: userEmail,
        replyTo: this.replyToPersonal,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html({
          firstName,
        }),
      });

      console.log(`Welcome email sent successfully to ${userEmail}`, result);

      return { success: true };
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendFirstMessageEmail(
    userEmail: string,
    firstName?: string | null,
    projectName: string = "your project",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmailDefault,
        to: userEmail,
        replyTo: this.replyToSupport,
        subject: firstMessageEmail.subject,
        html: firstMessageEmail.html({
          firstName,
          projectName,
        }),
      });

      console.log(
        `First message email sent successfully to ${userEmail}`,
        result,
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to send first message email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendReactivationEmail(
    userEmail: string,
    daysSinceSignup: number,
    hasProject: boolean,
    firstName?: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (await this.isEmailUnsubscribed(userEmail)) {
        // Skip send for unsubscribed recipients; mask PII and keep logs neutral
        console.debug("Reactivation email skipped: recipient is unsubscribed", {
          email: maskEmail(userEmail),
        });
        return { success: true };
      }
      const result = await this.resend.emails.send({
        from: this.fromEmailPersonal,
        to: userEmail,
        replyTo: this.replyToPersonal,
        subject: reactivationEmail.subject,
        html: reactivationEmail.html({
          firstName,
          daysSinceSignup,
          hasProject,
        }),
      });

      console.log(
        `Reactivation email sent successfully to ${userEmail}`,
        result,
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to send reactivation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
