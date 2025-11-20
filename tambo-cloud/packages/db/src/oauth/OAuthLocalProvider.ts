import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { eq } from "drizzle-orm";
import * as schema from "../schema";
import { HydraDb } from "../types";

export class OAuthLocalProvider implements OAuthClientProvider {
  private _clientInformation: OAuthClientInformation | undefined;
  private _codeVerifier: string | undefined;
  private _tokens: OAuthTokens | undefined;
  private _redirectStartAuthUrl: URL | undefined;
  private _saveAuthUrl: URL | undefined;
  private _sessionId: string;
  private _serverUrl: string | undefined;
  constructor(
    private db: HydraDb,
    private toolProviderUserContextId: string,
    {
      clientInformation,
      baseUrl,
      sessionId,
      serverUrl,
    }: {
      /** The base URL of the Tambo service, usually from process.env.VERCEL_URL */
      baseUrl?: string;
      /** The client information to use for the OAuth client, e.g. client_id, client_secret, etc. */
      clientInformation?: OAuthClientInformation;
      /** The session id to use for the OAuth client, generated if not provided */
      sessionId?: string;
      /** The server URL to use for the OAuth client */
      serverUrl?: string;
    } = {},
  ) {
    this._clientInformation = clientInformation;
    // we generate a session id, because we'll be asked to store the client information
    this._sessionId = sessionId ?? crypto.randomUUID();

    this._saveAuthUrl = baseUrl
      ? new URL(`/oauth/callback?sessionId=${this._sessionId}`, baseUrl)
      : undefined;
    this._serverUrl = serverUrl;
  }

  get redirectUrl(): string {
    return this._saveAuthUrl?.toString() ?? "";
  }

  // is this the same as the redirectUrl?
  get redirectStartAuthUrl(): URL | undefined {
    // something like https://mcp.linear.app/authorize?response_type=code&client_id=Um5UdcYtE52B1yUl&code_challenge=NBIRHJ5AoIwEnfgNLGxPEBzCVjdmguoG8lUNfahPVwM&code_challenge_method=S256&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdashboard%2Fp_TJLbISzk.a45164
    return this._redirectStartAuthUrl;
  }

  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    if (!this._clientInformation) {
      const session = await this.db.query.mcpOauthClients.findFirst({
        where: eq(schema.mcpOauthClients.sessionId, this._sessionId),
      });
      if (session) {
        this._clientInformation = session.sessionInfo.clientInformation;
      }
    }
    return this._clientInformation;
  }
  async saveClientInformation(clientInformation: OAuthClientInformationFull) {
    if (!this._serverUrl) {
      throw new Error("Cannot save client information without server URL");
    }
    await this.db.insert(schema.mcpOauthClients).values({
      toolProviderUserContextId: this.toolProviderUserContextId,
      sessionInfo: {
        serverUrl: this._serverUrl,
        clientInformation,
      },
      sessionId: this._sessionId,
    });
    this._clientInformation = clientInformation;
  }
  async codeVerifier() {
    if (!this._codeVerifier) {
      const session = await this.db.query.mcpOauthClients.findFirst({
        where: eq(schema.mcpOauthClients.sessionId, this._sessionId),
      });
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
    await this.db
      .update(schema.mcpOauthClients)
      .set({
        codeVerifier,
      })
      .where(eq(schema.mcpOauthClients.sessionId, this._sessionId));
  }
  get clientMetadata(): OAuthClientMetadata {
    const clientMetadata: OAuthClientMetadata = {
      redirect_uris: [this.redirectUrl],
      client_name: "Tambo",
    };
    return clientMetadata;
  }

  redirectToAuthorization(authorizationUrl: URL) {
    // save this so it can be used later
    this._redirectStartAuthUrl = authorizationUrl;
  }

  async tokens() {
    if (!this._tokens) {
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
}
