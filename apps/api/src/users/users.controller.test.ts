import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { UsersController } from "./users.controller";

const WEBHOOK_SECRET = "test-webhook-secret";

function createController() {
  const configService = new ConfigService({ WEBHOOK_SECRET });
  const logger = new CorrelationLoggerService();
  jest.spyOn(logger, "log").mockImplementation(() => {});
  jest.spyOn(logger, "warn").mockImplementation(() => {});
  return new UsersController(logger, configService);
}

const signupPayload = {
  type: "INSERT" as const,
  table: "users",
  schema: "auth",
  record: { id: "user-1" },
};

describe("UsersController", () => {
  describe("handleSignupWebhook", () => {
    it("acknowledges signup events without sending a welcome email", () => {
      const controller = createController();

      const result = controller.handleSignupWebhook(
        signupPayload,
        WEBHOOK_SECRET,
        "supabase",
      );

      expect(result).toEqual({
        acknowledged: true,
        emailSent: false,
        reason: "Welcome emails are disabled",
      });
    });

    it("ignores events that are not auth.users inserts", () => {
      const controller = createController();

      const result = controller.handleSignupWebhook(
        { ...signupPayload, type: "UPDATE" },
        WEBHOOK_SECRET,
      );

      expect(result).toEqual({
        acknowledged: true,
        reason: "Not a user signup event",
      });
    });

    it("rejects requests without the webhook secret", () => {
      const controller = createController();

      expect(() => controller.handleSignupWebhook(signupPayload)).toThrow(
        UnauthorizedException,
      );
    });

    it("rejects requests with an invalid webhook secret", () => {
      const controller = createController();

      expect(() =>
        controller.handleSignupWebhook(signupPayload, "wrong-secret"),
      ).toThrow(UnauthorizedException);
    });
  });
});
