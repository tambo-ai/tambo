import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import * as Sentry from "@sentry/nestjs";
import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { type Request } from "express";
import { SignJWT } from "jose";
import {
  OAuthTokenRequestDto,
  OAuthTokenResponseDto,
} from "../common/dto/oauth-token.dto";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { validateSubjectToken } from "../common/utils/oauth";
import { ApiKeyGuard, ProjectId } from "../projects/guards/apikey.guard";

@ApiTags("OAuth")
@Controller("oauth")
export class OAuthController {
  constructor(private readonly logger: CorrelationLoggerService) {}

  @ApiSecurity("apiKey")
  @UseGuards(ApiKeyGuard)
  @Post("token")
  @ApiConsumes("application/x-www-form-urlencoded")
  @ApiOperation({
    summary: "OAuth 2.0 Token Exchange Endpoint",
    description:
      "Exchanges an OAuth subject token for a Tambo access token following RFC 6749 and RFC 8693 specifications. Accepts form-encoded data and validates the subject token based on project OAuth validation settings.",
  })
  @ApiResponse({
    status: 200,
    description: "Token exchange successful",
    type: OAuthTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid grant type or missing parameters",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid OAuth token",
  })
  async exchangeOAuthToken(
    @Body() tokenRequest: OAuthTokenRequestDto,
    @Req() request: Request,
  ): Promise<OAuthTokenResponseDto> {
    if (!request[ProjectId]) {
      throw new BadRequestException("Project ID is required");
    }

    const projectId = request[ProjectId];
    const { grant_type, subject_token, subject_token_type } = tokenRequest;

    // Validate grant type per RFC 8693
    if (grant_type !== "urn:ietf:params:oauth:grant-type:token-exchange") {
      throw new BadRequestException(
        "Invalid grant_type. Must be 'urn:ietf:params:oauth:grant-type:token-exchange'",
      );
    }

    // Validate subject token type
    const validTokenTypes = [
      "urn:ietf:params:oauth:token-type:access_token",
      "urn:ietf:params:oauth:token-type:id_token",
    ];
    if (!validTokenTypes.includes(subject_token_type)) {
      throw new BadRequestException(
        `Invalid subject_token_type. Must be one of: ${validTokenTypes.join(", ")}`,
      );
    }

    try {
      // Get OAuth validation settings for this project
      const db = getDb(process.env.DATABASE_URL!);
      const oauthSettings = await operations.getOAuthValidationSettings(
        db,
        projectId,
      );

      if (!oauthSettings) {
        this.logger.log(
          `No OAuth settings found for project ${projectId}, using default (none)`,
        );
      }

      const validationMode = oauthSettings?.mode || OAuthValidationMode.NONE;

      const verifiedPayload = await Sentry.startSpan(
        {
          name: "oauth.validateSubjectToken",
          attributes: {
            projectId,
            validationMode,
          },
        },
        async () => {
          // Validate the subject token based on the configured mode
          const verifiedPayload = await validateSubjectToken(
            subject_token,
            validationMode,
            oauthSettings,
            this.logger,
          );
          return verifiedPayload;
        },
      );

      if (!verifiedPayload.sub) {
        throw new UnauthorizedException("Subject token missing subject (sub)");
      }

      // Create new token with projectId as issuer and same sub
      // Use per-project secret stored in the database for signing
      const bearerSecret = await operations.getBearerTokenSecret(db, projectId);
      if (!bearerSecret) {
        throw new InternalServerErrorException(
          "Project bearer secret not found",
        );
      }
      const signingKey = new TextEncoder().encode(bearerSecret);

      const currentTime = Math.floor(Date.now() / 1000);
      const maxExpiresIn = 3600; // 1 hour

      // Respect the incoming token's expiry - our token should not live longer than the original
      let expiresIn = maxExpiresIn;
      if (verifiedPayload.exp && typeof verifiedPayload.exp === "number") {
        const incomingTokenRemainingTime = verifiedPayload.exp - currentTime;
        if (
          incomingTokenRemainingTime > 0 &&
          incomingTokenRemainingTime < maxExpiresIn
        ) {
          expiresIn = incomingTokenRemainingTime;
          this.logger.log(
            `Limiting token expiry to ${expiresIn} seconds to match incoming token expiry`,
          );
        }
      }

      const accessToken = await new SignJWT({
        sub: verifiedPayload.sub,
        iss: projectId,
        aud: "tambo",
        iat: currentTime,
        exp: currentTime + expiresIn,
        // Include original issuer as a custom claim for unique context key generation
        // This prevents cross-provider user ID collisions (e.g., Google user "123" vs GitHub user "123")
        original_iss: verifiedPayload.iss,
        // Include organizational claims from various enterprise identity providers
        // Google Workspace: hosted domain claim
        original_hd: verifiedPayload.hd,
        // Microsoft Azure AD: tenant ID claim
        original_tid: verifiedPayload.tid,
        // WorkOS, Auth0, and other enterprise providers: organization claims
        original_org_id: verifiedPayload.org_id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .sign(signingKey);

      return {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        issued_token_type: "urn:ietf:params:oauth:token-type:access_token",
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error validating OAuth token: ${message}`, stack);

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new UnauthorizedException("Invalid OAuth subject token", {
        cause: error,
      });
    }
  }
}
