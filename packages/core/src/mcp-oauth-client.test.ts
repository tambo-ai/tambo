import {
  buildMcpOAuthCallbackUrl,
  buildMcpOAuthClientMetadata,
  buildMcpOAuthClientMetadataDocument,
  buildMcpOAuthClientMetadataUrl,
  canUseMcpOAuthClientMetadataUrl,
  canUseMcpOAuthRedirectBaseUrl,
  hasCompatibleMcpOAuthClientRedirect,
} from "./mcp-oauth-client";

describe("mcp-oauth-client", () => {
  const secureBaseUrl = "https://console.tambo.co";

  it("builds MCP OAuth client metadata with the expected fields", () => {
    expect(
      buildMcpOAuthClientMetadata({ baseUrl: secureBaseUrl, scope: "tools" }),
    ).toEqual({
      redirect_uris: ["https://console.tambo.co/oauth/callback"],
      client_name: "Tambo Cloud",
      client_uri: "https://console.tambo.co/",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      application_type: "web",
      scope: "tools",
    });
  });

  it("builds a metadata document with a stable client_id URL", () => {
    expect(
      buildMcpOAuthClientMetadataDocument({ baseUrl: secureBaseUrl }),
    ).toMatchObject({
      client_id: "https://console.tambo.co/oauth/client-metadata",
      redirect_uris: ["https://console.tambo.co/oauth/callback"],
    });
  });

  it("allows localhost redirect URLs but not metadata document URLs", () => {
    const localhostBaseUrl = "http://localhost:8260";

    expect(canUseMcpOAuthRedirectBaseUrl(localhostBaseUrl)).toBe(true);
    expect(canUseMcpOAuthClientMetadataUrl(localhostBaseUrl)).toBe(false);
    expect(buildMcpOAuthCallbackUrl(localhostBaseUrl)).toBe(
      "http://localhost:8260/oauth/callback",
    );
  });

  it("builds the metadata document URL for HTTPS deployments", () => {
    expect(buildMcpOAuthClientMetadataUrl(secureBaseUrl)).toBe(
      "https://console.tambo.co/oauth/client-metadata",
    );
  });

  it("requires HTTPS or localhost redirect origins", () => {
    expect(canUseMcpOAuthRedirectBaseUrl("https://console.tambo.co")).toBe(
      true,
    );
    expect(canUseMcpOAuthRedirectBaseUrl("http://127.0.0.1:8260")).toBe(true);
    expect(canUseMcpOAuthRedirectBaseUrl("http://example.com")).toBe(false);
  });

  it("treats matching URL-based client IDs as compatible with the callback URL", () => {
    expect(
      hasCompatibleMcpOAuthClientRedirect(
        {
          client_id: "https://console.tambo.co/oauth/client-metadata",
        },
        "https://console.tambo.co/oauth/callback",
      ),
    ).toBe(true);
  });

  it("rejects URL-based client IDs from a different origin", () => {
    expect(
      hasCompatibleMcpOAuthClientRedirect(
        {
          client_id: "https://old-console.tambo.co/oauth/client-metadata",
        },
        "https://console.tambo.co/oauth/callback",
      ),
    ).toBe(false);
  });

  it("keeps opaque pre-registered client IDs compatible when redirect URIs are absent", () => {
    expect(
      hasCompatibleMcpOAuthClientRedirect(
        {
          client_id: "mapbox-client-id",
        },
        "https://console.tambo.co/oauth/callback",
      ),
    ).toBe(true);
  });

  it("detects legacy dynamic registrations with mismatched redirect URIs", () => {
    expect(
      hasCompatibleMcpOAuthClientRedirect(
        {
          client_id: "legacy-client",
          redirect_uris: [
            "https://console.tambo.co/oauth/callback?sessionId=legacy",
          ],
        },
        "https://console.tambo.co/oauth/callback",
      ),
    ).toBe(false);
  });
});
