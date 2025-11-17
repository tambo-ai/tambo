import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    email?: string;
    raw_user_meta_data?: {
      full_name?: string;
      name?: string;
      first_name?: string;
    };
    created_at?: string;
  };
  old_record?: Record<string, unknown>;
}

@ApiTags("Users")
@Controller("users")
export class UsersController {
  private readonly webhookSecret: string;

  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private readonly emailService: EmailService,
    private readonly logger: CorrelationLoggerService,
    private readonly configService: ConfigService,
  ) {
    // Validate webhook secret at startup - fail fast if not configured
    const secret = this.configService.get<string>("WEBHOOK_SECRET");
    if (!secret) {
      throw new Error(
        "WEBHOOK_SECRET is not configured. Server cannot start without webhook authentication configured.",
      );
    }
    this.webhookSecret = secret;
    this.logger.log("Webhook authentication configured successfully");
  }

  @Post("webhook/signup")
  @HttpCode(200)
  @ApiOperation({
    summary: "Handle new user signup webhook from Supabase",
    description:
      "Triggered when a new user signs up via Supabase Auth. Requires webhook secret for authentication.",
  })
  @ApiHeader({
    name: "x-webhook-secret",
    description: "Shared secret for webhook authentication",
    required: true,
  })
  @ApiHeader({
    name: "x-webhook-source",
    description: "Source identifier for the webhook",
    required: false,
  })
  async handleSignupWebhook(
    @Body() payload: SupabaseWebhookPayload,
    @Headers("x-webhook-secret") webhookSecret?: string,
    @Headers("x-webhook-source") webhookSource?: string,
  ) {
    // Verify webhook secret from client
    if (!webhookSecret) {
      this.logger.warn("Missing webhook secret header");
      throw new UnauthorizedException("Missing authentication");
    }

    if (webhookSecret !== this.webhookSecret) {
      this.logger.warn("Invalid webhook secret");
      throw new UnauthorizedException("Invalid authentication");
    }

    // Optional: verify source
    if (webhookSource && webhookSource !== "supabase") {
      this.logger.warn(`Unexpected webhook source: ${webhookSource}`);
      throw new UnauthorizedException("Invalid webhook source");
    }

    // Only process INSERT events on auth.users table
    if (
      payload.type !== "INSERT" ||
      payload.table !== "users" ||
      payload.schema !== "auth"
    ) {
      this.logger.log(
        `Ignoring webhook event: ${payload.type} on ${payload.schema}.${payload.table}`,
      );
      return { acknowledged: true, reason: "Not a user signup event" };
    }

    const { record } = payload;
    const userId = record.id;
    const userEmail = record.email;

    if (!userEmail) {
      this.logger.warn(`New user ${userId} has no email address`);
      return { acknowledged: true, reason: "No email address" };
    }

    try {
      // Perform all validation checks
      const validation = await operations.validateUserForWelcomeEmail(
        this.db,
        userId,
        userEmail,
      );

      if (!validation.isValid) {
        throw new BadRequestException(validation.error);
      }

      if (validation.alreadySent) {
        this.logger.log(
          `Welcome email already sent for user ${userId}, skipping`,
        );
        return {
          acknowledged: true,
          emailSent: false,
          reason: "Welcome email already sent",
        };
      }

      // Extract first name from metadata
      const metadata = record.raw_user_meta_data || {};
      const firstName =
        metadata.first_name ||
        metadata.name?.split(" ")[0] ||
        metadata.full_name?.split(" ")[0];

      // Send welcome email
      const emailResult = await this.emailService.sendWelcomeEmail(
        userEmail,
        firstName,
      );

      // Track the email send
      await this.db.transaction(async (tx) => {
        await operations.trackWelcomeEmail(
          tx,
          userId,
          emailResult.success,
          emailResult.error,
        );
      });

      this.logger.log(
        `Welcome email ${emailResult.success ? "sent" : "failed"} for user ${userId}`,
      );

      return {
        acknowledged: true,
        emailSent: emailResult.success,
      };
    } catch (error) {
      // Don't track failures for validation errors
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      this.logger.error(
        `Error processing signup webhook for user ${userId}:`,
        error instanceof Error ? error.message : "Unknown error",
      );

      try {
        await this.db.transaction(async (tx) => {
          await operations.trackWelcomeEmail(
            tx,
            userId,
            false,
            error instanceof Error ? error.message : "Unknown error",
          );
        });
      } catch (trackingError) {
        this.logger.error(
          `Failed to track welcome email failure for user ${userId}:`,
          trackingError instanceof Error
            ? trackingError.message
            : "Unknown tracking error",
        );
      }

      // Always return success to prevent webhook retries, even if tracking failed
      return {
        acknowledged: true,
        emailSent: false,
        error: "Failed to send email",
      };
    }
  }
}
