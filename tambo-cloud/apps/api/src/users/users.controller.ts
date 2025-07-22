import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { Inject } from "@nestjs/common";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { operations } from "@tambo-ai-cloud/db";

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
  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private readonly emailService: EmailService,
    private readonly logger: CorrelationLoggerService,
  ) {}

  @Post("webhook/signup")
  @HttpCode(200)
  @ApiOperation({
    summary: "Handle new user signup webhook from Supabase",
    description: "Triggered when a new user signs up via Supabase Auth",
  })
  async handleSignupWebhook(@Body() payload: SupabaseWebhookPayload) {
    // Only process INSERT events on auth.users table
    if (
      payload.type !== "INSERT" ||
      payload.table !== "users" ||
      payload.schema !== "auth"
    ) {
      this.logger.log(
        `Ignoring webhook event: ${payload.type} on ${payload.schema}.${payload.table}`,
      );
      return { acknowledged: true };
    }

    const { record } = payload;
    const userId = record.id;
    const userEmail = record.email;

    if (!userEmail) {
      this.logger.warn(`New user ${userId} has no email address`);
      return { acknowledged: true };
    }

    // Extract first name from metadata
    const metadata = record.raw_user_meta_data || {};
    const firstName =
      metadata.first_name ||
      metadata.name?.split(" ")[0] ||
      metadata.full_name?.split(" ")[0];

    try {
      // Send welcome email
      const result = await this.emailService.sendWelcomeEmail(
        userEmail,
        firstName,
      );

      // Track the email send
      await operations.trackWelcomeEmail(
        this.db,
        userId,
        result.success,
        result.error,
      );

      this.logger.log(
        `Welcome email ${result.success ? "sent" : "failed"} for user ${userId}`,
      );

      return {
        acknowledged: true,
        emailSent: result.success,
      };
    } catch (error) {
      this.logger.error(
        `Error processing signup webhook for user ${userId}:`,
        error instanceof Error ? error.message : "Unknown error",
      );

      // Track the failure
      await operations.trackWelcomeEmail(
        this.db,
        userId,
        false,
        error instanceof Error ? error.message : "Unknown error",
      );

      // Return success to prevent webhook retries for email failures
      return {
        acknowledged: true,
        emailSent: false,
      };
    }
  }
}
