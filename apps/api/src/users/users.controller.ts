import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CorrelationLoggerService } from "../common/services/logger.service";

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
  };
  old_record?: Record<string, unknown>;
}

@ApiTags("Users")
@Controller("users")
export class UsersController {
  private readonly webhookSecret: string;

  constructor(
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
  handleSignupWebhook(
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

    // Lifecycle emails (including the welcome email) are disabled while
    // Tambo Cloud shuts down. Acknowledge so Supabase does not retry.
    this.logger.log(
      `Signup webhook received for user ${payload.record.id}; welcome emails are disabled`,
    );
    return {
      acknowledged: true,
      emailSent: false,
      reason: "Welcome emails are disabled",
    };
  }
}
