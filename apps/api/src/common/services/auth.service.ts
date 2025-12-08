import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TAMBO_MCP_ACCESS_KEY_CLAIM } from "@tambo-ai-cloud/core";
import { type HydraDatabase } from "@tambo-ai-cloud/db";
import { SignJWT } from "jose";
import { DATABASE } from "../middleware/db-transaction-middleware";

export interface McpAccessTokenResult {
  token: string;
  expiresAt: number;
  hasSession: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
  ) {}

  getDb() {
    // return this.tx ?? this.db;
    return this.db;
  }

  /**
   * Generates an MCP access token (JWT) for either a thread session or sessionless access.
   *
   * When threadId is provided, creates a session-bound token that includes projectId/threadId
   * and can use session-specific features (elicitation, sampling).
   *
   * When contextKey is provided, creates a sessionless token that includes projectId/contextKey
   * and can only access resources and prompts (no session-specific features).
   *
   * Notes on expiry/iat:
   * - We round down to the nearest 5 minutes and set `iat` to that window
   *   start so tokens minted within the same 5‑minute window are identical.
   * - `exp` is set to 15 minutes after the window start. If we ever need a
   *   guaranteed 15 minutes of validity from issuance, bump the offset to 20m.
   */
  async generateMcpAccessToken(
    projectId: string,
    options: { threadId: string } | { contextKey: string },
  ): Promise<McpAccessTokenResult> {
    const secret = this.configService.get<string>("API_KEY_SECRET");
    if (!secret) {
      throw new Error("API_KEY_SECRET is not configured");
    }

    const hasSession = "threadId" in options;

    // https://www.rfc-editor.org/rfc/rfc7519#section-4.1.4
    // Round down to the nearest 5 minutes, then add 15 minutes. This makes tokens
    // within a 5‑minute window share the same payload (deterministic iat) and remain
    // valid until 15 minutes after the window start. If you need a guaranteed
    // minimum validity from issuance (e.g., at least 15 minutes after minting),
    // increase the expiration offset to 20 minutes.
    const windowStartMs =
      Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000);
    const expiration = windowStartMs + 15 * 60 * 1000;
    const expSeconds = Math.floor(expiration / 1000);
    const windowStartSeconds = Math.floor(windowStartMs / 1000);

    const claim = hasSession
      ? { projectId, threadId: options.threadId }
      : { projectId, contextKey: options.contextKey };

    const subject = hasSession
      ? `${projectId}:${options.threadId}`
      : `${projectId}:sessionless`;

    // TODO: use a per-project, maybe per-thread, signing secret?
    const signedJwt = await new SignJWT({
      [TAMBO_MCP_ACCESS_KEY_CLAIM]: claim,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(projectId)
      .setSubject(subject)
      .setIssuedAt(windowStartSeconds)
      .setExpirationTime(expSeconds)
      .sign(new TextEncoder().encode(secret));

    return {
      token: signedJwt,
      expiresAt: expiration,
      hasSession,
    };
  }
}
