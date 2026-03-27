import type { OAuthClientInformationMixed } from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  InvalidClientMetadataError,
  ServerError,
  TemporarilyUnavailableError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
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

export function isManualMcpClientRegistrationRequiredError(
  error: unknown,
): boolean {
  if (error instanceof InvalidClientMetadataError) {
    return true;
  }

  if (
    error instanceof ServerError ||
    error instanceof TemporarilyUnavailableError
  ) {
    return false;
  }

  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("registration") ||
    message.includes("client details") ||
    message.includes("client metadata") ||
    message.includes("client_id") ||
    message.includes("client id") ||
    message.includes("response_types")
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
