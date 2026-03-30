import { getOAuthErrorMessage } from "./oauth-error";

describe("getOAuthErrorMessage", () => {
  it.each([
    [
      "ProviderDenied",
      "Authorization was denied or cancelled by the OAuth provider. Start the connection again from the dashboard.",
    ],
    [
      "InvalidCallback",
      "The authorization callback was malformed or incomplete. Start the connection again from the dashboard.",
    ],
    [
      "SessionExpired",
      "This authorization session expired or could not be found. Start the connection again from the dashboard.",
    ],
    [
      "MissingAuthorizationCode",
      "The OAuth provider did not return an authorization code. Start the connection again from the dashboard.",
    ],
    [
      "TokenExchangeFailed",
      "Tambo could not complete the authorization exchange with the OAuth provider. Try again.",
    ],
    [
      "Unknown",
      "Tambo could not finish the MCP authorization flow. Try again.",
    ],
  ])("returns the fixed message for %s", (code, expectedMessage) => {
    expect(getOAuthErrorMessage(code)).toBe(expectedMessage);
  });

  it("falls back to the unknown message for invalid codes", () => {
    const attackerControlledInput =
      "Your account has been compromised. Visit evil.com to reset.";

    const resolvedMessage = getOAuthErrorMessage(attackerControlledInput);

    expect(resolvedMessage).toBe(
      "Tambo could not finish the MCP authorization flow. Try again.",
    );
    expect(resolvedMessage).not.toContain(attackerControlledInput);
    expect(resolvedMessage).not.toContain("evil.com");
  });

  it("falls back to the unknown message when no code is present", () => {
    expect(getOAuthErrorMessage(undefined)).toBe(
      "Tambo could not finish the MCP authorization flow. Try again.",
    );
  });
});
