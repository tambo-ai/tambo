import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isResendEmailUnsubscribed, maskEmail } from "@tambo-ai-cloud/core";
import { Resend } from "resend";
import { FREE_MESSAGE_LIMIT } from "../../threads/types/errors";
import { firstMessageEmail } from "../emails/first-message";
import { messageLimitEmail } from "../emails/message-limit";
import { welcomeEmail } from "../emails/welcome";

@Injectable()
export class EmailService {
  private readonly resend?: Resend;
  private readonly fromEmailDefault?: string;
  private readonly fromEmailPersonal?: string;
  private readonly replyToSupport?: string;
  private readonly replyToPersonal?: string;
  private readonly resendAudienceId?: string;

  constructor(private readonly configService: ConfigService) {
    const missing: string[] = [];

    // Helper to trim and treat empty/whitespace as undefined
    const getTrimmed = (key: string) =>
      this.configService.get<string>(key)?.trim() || undefined;

    const resendApiKey = getTrimmed("RESEND_API_KEY");
    if (!resendApiKey) {
      missing.push("RESEND_API_KEY");
    } else {
      this.resend = new Resend(resendApiKey);
    }

    this.fromEmailDefault = getTrimmed("EMAIL_FROM_DEFAULT");
    if (!this.fromEmailDefault) {
      missing.push("EMAIL_FROM_DEFAULT");
    }

    this.fromEmailPersonal = getTrimmed("EMAIL_FROM_PERSONAL");
    if (!this.fromEmailPersonal) {
      missing.push("EMAIL_FROM_PERSONAL");
    }

    this.replyToSupport = getTrimmed("EMAIL_REPLY_TO_SUPPORT");
    if (!this.replyToSupport) {
      missing.push("EMAIL_REPLY_TO_SUPPORT");
    }

    this.replyToPersonal = getTrimmed("EMAIL_REPLY_TO_PERSONAL");
    if (!this.replyToPersonal) {
      missing.push("EMAIL_REPLY_TO_PERSONAL");
    }

    this.resendAudienceId = getTrimmed("RESEND_AUDIENCE_ID");

    // Log granular configuration status
    if (missing.length > 0) {
      const hasResend = Boolean(this.resend);
      const hasDefaultChannel = Boolean(
        this.fromEmailDefault && this.replyToSupport,
      );
      const hasPersonalChannel = Boolean(
        this.fromEmailPersonal && this.replyToPersonal,
      );

      const disabled = [
        !hasResend && "all emails (no RESEND_API_KEY)",
        hasResend && !hasDefaultChannel && "default/support emails",
        hasResend && !hasPersonalChannel && "personal emails",
      ]
        .filter(Boolean)
        .join(", ");

      console.warn(
        `EmailService: partial configuration; ${disabled} disabled. Missing: ${missing.join(", ")}`,
      );
    }
  }

  private requireChannel(kind: "default" | "personal") {
    const resend = this.resend;
    if (!resend)
      return {
        success: false,
        error: "Email service not configured",
      } as const;

    if (kind === "default") {
      if (!this.fromEmailDefault || !this.replyToSupport)
        return {
          success: false,
          error: "Default email channel not configured",
        } as const;
      return {
        success: true,
        resend,
        from: this.fromEmailDefault,
        replyTo: this.replyToSupport,
      } as const;
    }

    if (!this.fromEmailPersonal || !this.replyToPersonal)
      return {
        success: false,
        error: "Personal email channel not configured",
      } as const;
    return {
      success: true,
      resend,
      from: this.fromEmailPersonal,
      replyTo: this.replyToPersonal,
    } as const;
  }

  private async isEmailUnsubscribed(userEmail: string): Promise<boolean> {
    const resend = this.resend;
    const audienceId = this.resendAudienceId;
    if (!resend || !audienceId) return false;
    return await isResendEmailUnsubscribed(
      resend.contacts,
      audienceId,
      userEmail,
    );
  }

  async sendMessageLimitNotification(
    projectId: string,
    userEmail: string,
    projectName: string,
  ): Promise<{ success: boolean; error?: string }> {
    const ch = this.requireChannel("default");
    if (!ch.success) {
      const error = ch.error;
      console.warn(
        `EmailService: skipping message limit notification for ${maskEmail(userEmail)}; ${error}.`,
      );
      return { success: false, error };
    }

    try {
      await ch.resend.emails.send({
        from: ch.from,
        to: userEmail,
        replyTo: ch.replyTo,
        subject: messageLimitEmail.subject,
        html: messageLimitEmail.html({
          projectId,
          projectName,
          messageLimit: FREE_MESSAGE_LIMIT,
        }),
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send message limit notification email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    firstName?: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    const ch = this.requireChannel("personal");
    if (!ch.success) {
      const error = ch.error;
      console.warn(
        `EmailService: skipping welcome email for ${maskEmail(userEmail)}; ${error}.`,
      );
      return { success: false, error };
    }

    try {
      if (await this.isEmailUnsubscribed(userEmail)) {
        console.debug("Welcome email skipped: recipient is unsubscribed", {
          email: maskEmail(userEmail),
        });
        return { success: true };
      }
      const result = await ch.resend.emails.send({
        from: ch.from,
        to: userEmail,
        replyTo: ch.replyTo,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html({
          firstName,
        }),
      });

      const masked = maskEmail(userEmail);
      console.log(`Welcome email sent successfully to ${masked}`, {
        id: (result as { data?: { id?: string } }).data?.id,
      });

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
    const ch = this.requireChannel("default");
    if (!ch.success) {
      const error = ch.error;
      console.warn(
        `EmailService: skipping first message email for ${maskEmail(userEmail)}; ${error}.`,
      );
      return { success: false, error };
    }

    try {
      const result = await ch.resend.emails.send({
        from: ch.from,
        to: userEmail,
        replyTo: ch.replyTo,
        subject: firstMessageEmail.subject,
        html: firstMessageEmail.html({
          firstName,
          projectName,
        }),
      });

      const masked = maskEmail(userEmail);
      console.log(`First message email sent successfully to ${masked}`, {
        id: (result as { data?: { id?: string } }).data?.id,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send first message email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
