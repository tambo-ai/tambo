import {
  InvalidClientMetadataError,
  ServerError,
  TemporarilyUnavailableError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import {
  isManualMcpClientRegistrationRequiredError,
  requiresManualMcpClientRegistration,
  type McpAuthorizationServerDetails,
  shouldReusePersistedMcpOAuthState,
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
  it("reuses persisted OAuth state when the stored client is still compatible", () => {
    expect(
      shouldReusePersistedMcpOAuthState({
        clientInformation: {
          client_id: "https://console.tambo.co/oauth/client-metadata",
        },
        hasManualClientRegistration: false,
        redirectUrl: "https://console.tambo.co/oauth/callback",
      }),
    ).toBe(true);
  });

  it("does not reuse persisted OAuth state for legacy session-based redirects", () => {
    expect(
      shouldReusePersistedMcpOAuthState({
        clientInformation: {
          client_id: "legacy-client",
          redirect_uris: [
            "https://console.tambo.co/oauth/callback?sessionId=legacy",
          ],
        },
        hasManualClientRegistration: false,
        redirectUrl: "https://console.tambo.co/oauth/callback",
      }),
    ).toBe(false);
  });

  it("does not reuse persisted OAuth state when manual registration is provided", () => {
    expect(
      shouldReusePersistedMcpOAuthState({
        clientInformation: {
          client_id: "opaque-client-id",
        },
        hasManualClientRegistration: true,
        redirectUrl: "https://console.tambo.co/oauth/callback",
      }),
    ).toBe(false);
  });

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

  it("requires manual registration for invalid client metadata errors", () => {
    expect(
      isManualMcpClientRegistrationRequiredError(
        new InvalidClientMetadataError("Invalid client metadata"),
      ),
    ).toBe(true);
  });

  it("does not require manual registration for generic OAuth parse failures", () => {
    expect(
      isManualMcpClientRegistrationRequiredError(
        new ServerError(
          "Invalid OAuth error response: <html>bad gateway</html>",
        ),
      ),
    ).toBe(false);
  });

  it("does not require manual registration for temporary authorization server outages", () => {
    expect(
      isManualMcpClientRegistrationRequiredError(
        new TemporarilyUnavailableError("Authorization server is overloaded"),
      ),
    ).toBe(false);
  });

  it("still recognizes registration-specific validation failures", () => {
    expect(
      isManualMcpClientRegistrationRequiredError(
        new Error("client metadata response_types value is invalid"),
      ),
    ).toBe(true);
  });
});
