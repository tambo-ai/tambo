import {
  requiresManualMcpClientRegistration,
  type McpAuthorizationServerDetails,
} from "./mcp-oauth-registration";

function createAuthorizationServerDetails(
  overrides: Partial<McpAuthorizationServerDetails> = {},
): McpAuthorizationServerDetails {
  return {
    authorizationServer: "https://mcp.example.com",
    hasRegistrationEndpoint: false,
    metadataDiscovered: true,
    supportsClientMetadataDocument: false,
    ...overrides,
  };
}

describe("mcp-oauth-registration", () => {
  it("requires manual registration when discovery explicitly rules out auto-registration", () => {
    expect(
      requiresManualMcpClientRegistration(createAuthorizationServerDetails()),
    ).toBe(true);
  });

  it("still allows the auth flow to try legacy registration when metadata is unavailable", () => {
    expect(
      requiresManualMcpClientRegistration(
        createAuthorizationServerDetails({
          metadataDiscovered: false,
        }),
      ),
    ).toBe(false);
  });
});
