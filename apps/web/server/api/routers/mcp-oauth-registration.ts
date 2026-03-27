import type { OAuthClientInformationMixed } from "@modelcontextprotocol/sdk/shared/auth.js";
import { hasCompatibleMcpOAuthClientRedirect } from "@tambo-ai-cloud/core";

export interface McpAuthorizationServerDetails {
  authorizationServer: string;
  hasRegistrationEndpoint: boolean;
  metadataDiscovered: boolean;
  supportsClientMetadataDocument: boolean;
}

export function shouldReusePersistedMcpOAuthState({
  clientInformation,
  hasManualClientRegistration,
  redirectUrl,
}: {
  clientInformation?: OAuthClientInformationMixed | null;
  hasManualClientRegistration: boolean;
  redirectUrl: string;
}): boolean {
  if (!clientInformation || hasManualClientRegistration) {
    return false;
  }

  return hasCompatibleMcpOAuthClientRedirect(clientInformation, redirectUrl);
}

export function requiresManualMcpClientRegistration(
  details: McpAuthorizationServerDetails,
): boolean {
  return (
    details.metadataDiscovered &&
    !details.hasRegistrationEndpoint &&
    !details.supportsClientMetadataDocument
  );
}
