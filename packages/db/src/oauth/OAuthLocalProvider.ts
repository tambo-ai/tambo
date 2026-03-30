import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import {
  OAuthClientInformation,
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  buildMcpOAuthCallbackUrl,
  buildMcpOAuthClientMetadata,
  buildMcpOAuthClientMetadataUrl,
  canUseMcpOAuthClientMetadataUrl,
} from "@tambo-ai-cloud/core";
import { eq } from "drizzle-orm";
import * as schema from "../schema";
import { HydraDb } from "../types";

export class OAuthLocalProvider implements OAuthClientProvider {
  private _clientInformation: OAuthClientInformation | undefined;
  private _cachedSession:
    | {
        clientInformation: OAuthClientInformation;
        codeVerifier: string | null;
      }
    | null
    | undefined;
  private _codeVerifier: string | undefined;
  private _tokens: OAuthTokens | undefined;
  private _redirectStartAuthUrl: URL | undefined;
  private _saveAuthUrl: URL | undefined;
  private _sessionId: string;
  private _baseUrl: string | undefined;
  private _serverUrl: string | undefined;
  private _usePersistedContextState: boolean;
  readonly redirectUrl: string | undefined;
  readonly clientMetadataUrl: string | undefined;
  constructor(
    private db: HydraDb,
    private toolProviderUserContextId: string,
    {
      clientInformation,
      baseUrl,
      sessionId,
      serverUrl,
      usePersistedContextState = true,
    }: {
      /** The base URL of the Tambo service, usually from process.env.VERCEL_URL */
      baseUrl?: string;
      /** The client information to use for the OAuth client, e.g. client_id, client_secret, etc. */
      clientInformation?: OAuthClientInformation;
      /** The session id to use for the OAuth client, generated if not provided */
      sessionId?: string;
      /** The server URL to use for the OAuth client */
      serverUrl?: string;
      /** Whether to reuse the shared context client info and tokens for this auth attempt */
      usePersistedContextState?: boolean;
    } = {},
  ) {
    this._clientInformation = clientInformation;
    // we generate a session id, because we'll be asked to store the client information
    this._sessionId = sessionId ?? crypto.randomUUID();
    this._baseUrl = baseUrl;
    this._usePersistedContextState = usePersistedContextState;

    this._saveAuthUrl = baseUrl
      ? new URL(buildMcpOAuthCallbackUrl(baseUrl))
      : undefined;
    this.redirectUrl = this._saveAuthUrl?.toString();
    this.clientMetadataUrl =
      baseUrl && canUseMcpOAuthClientMetadataUrl(baseUrl)
        ? buildMcpOAuthClientMetadataUrl(baseUrl)
        : undefined;
    this._serverUrl = serverUrl;
  }

  // is this the same as the redirectUrl?
  get redirectStartAuthUrl(): URL | undefined {
    // something like https://mcp.linear.app/authorize?response_type=code&client_id=Um5UdcYtE52B1yUl&code_challenge=NBIRHJ5AoIwEnfgNLGxPEBzCVjdmguoG8lUNfahPVwM&code_challenge_method=S256&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdashboard%2Fp_TJLbISzk.a45164
    return this._redirectStartAuthUrl;
  }

  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    if (!this._clientInformation) {
      if (this._usePersistedContextState) {
        const toolProviderUserContext =
          await this.db.query.toolProviderUserContexts.findFirst({
            where: eq(
              schema.toolProviderUserContexts.id,
              this.toolProviderUserContextId,
            ),
          });

        if (toolProviderUserContext?.mcpOauthClientInfo) {
          this._clientInformation = toolProviderUserContext.mcpOauthClientInfo;
          return this._clientInformation;
        }
      }

      const session = await this.getCachedSession();
      if (session) {
        this._clientInformation = session.clientInformation;
      }
    }
    return this._clientInformation;
  }

  state(): string {
    return this._sessionId;
  }

  async saveClientInformation(clientInformation: OAuthClientInformationMixed) {
    if (!this._serverUrl) {
      throw new Error("Cannot save client information without server URL");
    }

    await this.db
      .insert(schema.mcpOauthClients)
      .values({
        toolProviderUserContextId: this.toolProviderUserContextId,
        sessionInfo: {
          serverUrl: this._serverUrl,
          clientInformation,
        },
        sessionId: this._sessionId,
      })
      .onConflictDoUpdate({
        target: schema.mcpOauthClients.sessionId,
        set: {
          sessionInfo: {
            serverUrl: this._serverUrl,
            clientInformation,
          },
        },
      });

    this._clientInformation = clientInformation;
    this._cachedSession = {
      clientInformation,
      codeVerifier:
        this._cachedSession?.codeVerifier ?? this._codeVerifier ?? null,
    };
  }
  async codeVerifier() {
    if (!this._codeVerifier) {
      const session = await this.getCachedSession();
      if (!session || !session.codeVerifier) {
        throw new Error(
          `Code verifier not set: ${!session ? "session not found" : "codeVerifier is null"}`,
        );
      }
      this._codeVerifier = session.codeVerifier;
    }
    return this._codeVerifier;
  }

  async saveCodeVerifier(codeVerifier: string) {
    this._codeVerifier = codeVerifier;
    if (!this._serverUrl) {
      throw new Error("Cannot save code verifier without server URL");
    }

    const clientInformation =
      this._clientInformation ??
      (await this.clientInformation()) ??
      (this.clientMetadataUrl
        ? { client_id: this.clientMetadataUrl }
        : undefined);

    if (!clientInformation) {
      throw new Error(
        "Cannot save code verifier without OAuth client information",
      );
    }

    await this.db
      .insert(schema.mcpOauthClients)
      .values({
        toolProviderUserContextId: this.toolProviderUserContextId,
        sessionInfo: {
          serverUrl: this._serverUrl,
          clientInformation,
        },
        sessionId: this._sessionId,
        codeVerifier,
      })
      .onConflictDoUpdate({
        target: schema.mcpOauthClients.sessionId,
        set: {
          codeVerifier,
        },
      });

    this._cachedSession = {
      clientInformation,
      codeVerifier,
    };
  }

  get clientMetadata(): OAuthClientMetadata {
    if (!this._baseUrl) {
      throw new Error(
        "Cannot build MCP OAuth client metadata without base URL",
      );
    }

    return buildMcpOAuthClientMetadata({ baseUrl: this._baseUrl });
  }

  redirectToAuthorization(authorizationUrl: URL) {
    // save this so it can be used later
    this._redirectStartAuthUrl = authorizationUrl;
  }

  async tokens() {
    if (!this._tokens) {
      if (this._usePersistedContextState) {
        const toolProviderUserContext =
          await this.db.query.toolProviderUserContexts.findFirst({
            where: eq(
              schema.toolProviderUserContexts.id,
              this.toolProviderUserContextId,
            ),
          });
        if (toolProviderUserContext?.mcpOauthTokens) {
          this._tokens = toolProviderUserContext.mcpOauthTokens;
        }
      }
    }

    return this._tokens;
  }

  async saveTokens(tokens: OAuthTokens) {
    // at this point we want to migrate the entire auth state to the toolProviderUserContext table
    this._tokens = tokens;

    await this.db
      .update(schema.toolProviderUserContexts)
      .set({
        mcpOauthTokens: tokens,
        mcpOauthClientInfo: this._clientInformation,
      })
      .where(
        eq(schema.toolProviderUserContexts.id, this.toolProviderUserContextId),
      );
  }

  private async getCachedSession() {
    if (this._cachedSession !== undefined) {
      return this._cachedSession;
    }

    const session = await this.db.query.mcpOauthClients.findFirst({
      where: eq(schema.mcpOauthClients.sessionId, this._sessionId),
    });

    this._cachedSession = session
      ? {
          clientInformation: session.sessionInfo.clientInformation,
          codeVerifier: session.codeVerifier,
        }
      : null;

    return this._cachedSession;
  }
}
