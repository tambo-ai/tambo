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
}
