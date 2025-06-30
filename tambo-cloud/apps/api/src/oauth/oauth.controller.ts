import {
  BadRequestException,
  Body,
  Controller,
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
import { Request } from "express";
import { createRemoteJWKSet, decodeJwt, jwtVerify, SignJWT } from "jose";
import {
  OAuthTokenRequestDto,
  OAuthTokenResponseDto,
} from "../common/dto/oauth-token.dto";
import { CorrelationLoggerService } from "../common/services/logger.service";
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
      "Exchanges an OAuth subject token for a Tambo access token following RFC 6749 and RFC 8693 specifications. Accepts form-encoded data and validates the subject token against the issuer's JWKS.",
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
      // Decode the token without verification to get the issuer
      const payload = decodeJwt(subject_token);

      if (!payload.iss) {
        throw new BadRequestException("Subject token missing issuer (iss)");
      }

      // Fetch OpenID configuration
      const openidConfigUrl = `${payload.iss}/.well-known/openid-configuration`;
      this.logger.log(`Fetching OpenID configuration from: ${openidConfigUrl}`);

      const configResponse = await fetch(openidConfigUrl);
      if (!configResponse.ok) {
        throw new UnauthorizedException(
          `Failed to fetch OpenID configuration: ${configResponse.statusText}`,
        );
      }

      const openidConfig = await configResponse.json();
      if (!openidConfig.jwks_uri) {
        throw new UnauthorizedException(
          "OpenID configuration missing jwks_uri",
        );
      }

      // Create JWKS and verify the token
      const JWKS = createRemoteJWKSet(new URL(openidConfig.jwks_uri));

      const { payload: verifiedPayload } = await jwtVerify(
        subject_token,
        JWKS,
        {
          issuer: payload.iss,
        },
      );

      if (!verifiedPayload.sub) {
        throw new UnauthorizedException("Subject token missing subject (sub)");
      }

      // Create new token with projectId as issuer and same sub
      // TODO: Fetch signing key from database instead of using dummy value
      const signingKey = new TextEncoder().encode(`token-for-${projectId}`);

      const expiresIn = 3600; // 1 hour
      const currentTime = Math.floor(Date.now() / 1000);

      const accessToken = await new SignJWT({
        sub: verifiedPayload.sub,
        iss: projectId,
        aud: "tambo",
        iat: currentTime,
        exp: currentTime + expiresIn,
      })
        .setProtectedHeader({ alg: "HS256" })
        .sign(signingKey);

      this.logger.log(
        `OAuth token exchanged successfully for project ${projectId}`,
      );

      return {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        issued_token_type: "urn:ietf:params:oauth:token-type:access_token",
      };
    } catch (error: any) {
      this.logger.error(
        `Error validating OAuth token: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException("Invalid OAuth subject token", {
        cause: error,
      });
    }
  }
}
