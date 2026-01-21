import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PostHog } from "posthog-node";

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private readonly client?: PostHog;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("POSTHOG_API_KEY")?.trim();
    if (apiKey) {
      this.client = new PostHog(apiKey, {
        host:
          this.configService.get<string>("POSTHOG_HOST")?.trim() ||
          "https://app.posthog.com",
      });
    }
  }

  /**
   * Capture an analytics event.
   * Silently skips if PostHog is not configured (OSS deployments).
   * @param distinctId - The user ID to associate the event with
   * @param event - The event name
   * @param properties - Optional event properties
   */
  capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ): void {
    this.client?.capture({ distinctId, event, properties });
  }

  /**
   * Identify a user with properties.
   * Silently skips if PostHog is not configured.
   * @param distinctId - The user ID
   * @param properties - User properties to set
   */
  identify(distinctId: string, properties?: Record<string, unknown>): void {
    this.client?.identify({ distinctId, properties });
  }

  /**
   * Check if analytics is enabled.
   * @returns true if PostHog client is configured
   */
  isEnabled(): boolean {
    return Boolean(this.client);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.shutdown();
  }
}
