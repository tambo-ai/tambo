export interface McpAuthorizationServerDetails {
  authorizationServer: string;
  hasRegistrationEndpoint: boolean;
  metadataDiscovered: boolean;
  supportsClientMetadataDocument: boolean;
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
