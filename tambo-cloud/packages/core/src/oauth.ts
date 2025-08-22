import { JWTPayload } from "jose";

/** this is a wrapper around the client information used during the oauth flow */
export interface SessionClientInformation {
  serverUrl: string;
  clientInformation: OAuthClientInformation;
}

/** This is a direct copy of the OAuthClientInformation type from @modelcontextprotocol/sdk */
export type OAuthClientInformation = {
  client_id: string;
  client_secret?: string | undefined;
  client_id_issued_at?: number | undefined;
  client_secret_expires_at?: number | undefined;
};

/** This is the shape of the tokens returned by the OAuth provider */
export interface OAuthTokens {
  /** The access token  - refresh this token periodically */
  access_token: string;
  /** How to use the token */
  token_type: string; // usually "bearer"
  /** The token used to refresh the access_token */
  refresh_token?: string;
  /** The number of seconds the access_token will be valid for */
  expires_in?: number;
  /** The scope of the token, depends on the client */
  scope?: string;
  id_token?: string;
}

export interface OidcProviderConfig {
  issuer: string;
  token_endpoint: string;
  jwks_uri: string;
  // …you can add other fields if you need them (userinfo_endpoint, etc.)
}

async function getOidcConfig(issuer: string): Promise<OidcProviderConfig> {
  const res = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error("Failed to fetch OIDC config");
  const config = (await res.json()) as OidcProviderConfig;
  return config;
}

/**
 * Refresh any OIDC token by using OIDC discovery to get the refresh endpoint
 * and then using the refresh token to get a new access token
 *
 * @param token - The token to refresh
 * @param refreshToken - The refresh token to use
 * @param client_id - The client ID to use
 * @param client_secret - The client secret to use
 * @returns The refreshed token
 */
export async function refreshOidcToken(
  token: JWTPayload,
  refreshToken: string,
  client_id: string,
  client_secret: string,
): Promise<JWTPayload> {
  if (!refreshToken || !token.iss) {
    console.error("Missing refresh token or issuer", token, refreshToken);
    throw new Error("Missing refresh token or issuer");
  }
  const { token_endpoint } = await getOidcConfig(token.iss);
  const params = new URLSearchParams({
    client_id: client_id,
    client_secret: client_secret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const refreshed = (await res.json()) as OAuthTokens;
  if (!res.ok) throw refreshed;

  return {
    ...token,
    accessToken: refreshed.access_token,
    idToken: refreshed.id_token,
    accessTokenExpires: Date.now() + (refreshed.expires_in ?? 0) * 1000,
    // some providers rotate refresh tokens
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
  };
}
