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
    console.log("--> redirectUrl", this._saveAuthUrl?.toString());
    return this._saveAuthUrl?.toString() ?? "";
  }

  // is this the same as the redirectUrl?
  get redirectStartAuthUrl(): URL | undefined {
    console.log("--> redirectStartAuthUrl");
    // something like https://mcp.linear.app/authorize?response_type=code&client_id=Um5UdcYtE52B1yUl&code_challenge=NBIRHJ5AoIwEnfgNLGxPEBzCVjdmguoG8lUNfahPVwM&code_challenge_method=S256&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdashboard%2Fp_TJLbISzk.a45164
    return this._redirectStartAuthUrl;
  }

  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    console.log("--> clientInformation", this._clientInformation);
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
    console.log("--> saveClientInformation", clientInformation);

    if (!this._serverUrl) {
      throw new Error("Cannot save client information without server URL");
    }
    const [client] = await this.db
      .insert(schema.mcpOauthClients)
      .values({
        toolProviderUserContextId: this.toolProviderUserContextId,
        sessionInfo: {
          serverUrl: this._serverUrl,
          clientInformation,
        },
        sessionId: this._sessionId,
      })
      .returning();
    this._clientInformation = clientInformation;
    console.log("--> saveClientInformation stored", client);
  }
  async codeVerifier() {
    console.log("--> codeVerifier", this._codeVerifier);
    if (!this._codeVerifier) {
      console.log("--> codeVerifier: fetching from db");
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
    console.log("--> saveCodeVerifier", codeVerifier);
    this._codeVerifier = codeVerifier;
    const updatedRows = await this.db
      .update(schema.mcpOauthClients)
      .set({
        codeVerifier,
      })
      .where(eq(schema.mcpOauthClients.sessionId, this._sessionId))
      .returning();
    console.log("--> saveCodeVerifier stored", updatedRows);
  }
  get clientMetadata(): OAuthClientMetadata {
    const clientMetadata: OAuthClientMetadata = {
      redirect_uris: [this.redirectUrl],
      client_name: "Tambo",
    };

    console.log("--> clientMetadata", clientMetadata);
    return clientMetadata;
  }

  redirectToAuthorization(authorizationUrl: URL) {
    console.log("--> redirectToAuthorization", authorizationUrl.toString());
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
    console.log("--> tokens", this._tokens);

    return this._tokens;
  }

  async saveTokens(tokens: OAuthTokens) {
    // at this point we want to migrate the entire auth state to the toolProviderUserContext table
    console.log("--> saveTokens", tokens);
    this._tokens = tokens;

    const updatedRows = await this.db
      .update(schema.toolProviderUserContexts)
      .set({
        mcpOauthTokens: tokens,
        mcpOauthClientInfo: this._clientInformation,
      })
      .where(
        eq(schema.toolProviderUserContexts.id, this.toolProviderUserContextId),
      )
      .returning();
    console.log("--> saveTokens stored", updatedRows);
  }
}
