import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
} from "@modelcontextprotocol/sdk/shared/auth.js";

export const TAMBO_MCP_OAUTH_CLIENT_NAME = "Tambo Cloud";
export const TAMBO_MCP_OAUTH_CLIENT_METADATA_PATH = "/oauth/client-metadata";

type TamboMcpOAuthClientMetadata = OAuthClientMetadata & {
  application_type: "web";
};

type TamboMcpOAuthClientMetadataDocument = TamboMcpOAuthClientMetadata & {
  client_id: string;
};

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function parseBaseUrl(baseUrl: string): URL {
  return new URL(baseUrl);
}

function getClientUri(baseUrl: string): string {
  return new URL("/", parseBaseUrl(baseUrl)).toString();
}

export function canUseMcpOAuthRedirectBaseUrl(baseUrl: string): boolean {
  const parsedBaseUrl = parseBaseUrl(baseUrl);

  return (
    parsedBaseUrl.protocol === "https:" ||
    (parsedBaseUrl.protocol === "http:" &&
      LOOPBACK_HOSTS.has(parsedBaseUrl.hostname))
  );
}

export function canUseMcpOAuthClientMetadataUrl(baseUrl: string): boolean {
  return parseBaseUrl(baseUrl).protocol === "https:";
}

export function buildMcpOAuthCallbackUrl(baseUrl: string): string {
  return new URL("/oauth/callback", parseBaseUrl(baseUrl)).toString();
}

export function buildMcpOAuthClientMetadataUrl(baseUrl: string): string {
  return new URL(
    TAMBO_MCP_OAUTH_CLIENT_METADATA_PATH,
    parseBaseUrl(baseUrl),
  ).toString();
}

export function buildMcpOAuthClientMetadata({
  baseUrl,
  scope,
}: {
  baseUrl: string;
  scope?: string;
}): TamboMcpOAuthClientMetadata {
  const metadata: TamboMcpOAuthClientMetadata = {
    redirect_uris: [buildMcpOAuthCallbackUrl(baseUrl)],
    client_name: TAMBO_MCP_OAUTH_CLIENT_NAME,
    client_uri: getClientUri(baseUrl),
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    application_type: "web",
  };

  if (scope !== undefined) {
    metadata.scope = scope;
  }

  return metadata;
}

export function buildMcpOAuthClientMetadataDocument({
  baseUrl,
  scope,
}: {
  baseUrl: string;
  scope?: string;
}): TamboMcpOAuthClientMetadataDocument {
  return {
    ...buildMcpOAuthClientMetadata({ baseUrl, scope }),
    client_id: buildMcpOAuthClientMetadataUrl(baseUrl),
  };
}

export function hasCompatibleMcpOAuthClientRedirect(
  clientInformation: OAuthClientInformationMixed | undefined,
  redirectUrl: string,
): boolean {
  if (!clientInformation) {
    return false;
  }

  if (!("redirect_uris" in clientInformation)) {
    if (!isTamboMcpOAuthClientId(clientInformation.client_id)) {
      return true;
    }

    return (
      clientInformation.client_id ===
      buildMcpOAuthClientMetadataUrl(redirectUrl)
    );
  }

  return clientInformation.redirect_uris.includes(redirectUrl);
}

function isTamboMcpOAuthClientId(clientId: string): boolean {
  try {
    return new URL(clientId).pathname === TAMBO_MCP_OAUTH_CLIENT_METADATA_PATH;
  } catch {
    return false;
  }
}
