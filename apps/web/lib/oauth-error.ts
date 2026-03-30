import { z } from "zod/v3";

export const oauthErrorCodeSchema = z.enum([
  "ProviderDenied",
  "InvalidCallback",
  "SessionExpired",
  "MissingAuthorizationCode",
  "TokenExchangeFailed",
  "Unknown",
]);

export type OAuthErrorCode = z.infer<typeof oauthErrorCodeSchema>;

const OAUTH_ERROR_MESSAGES = {
  ProviderDenied:
    "Authorization was denied or cancelled by the OAuth provider. Start the connection again from the dashboard.",
  InvalidCallback:
    "The authorization callback was malformed or incomplete. Start the connection again from the dashboard.",
  SessionExpired:
    "This authorization session expired or could not be found. Start the connection again from the dashboard.",
  MissingAuthorizationCode:
    "The OAuth provider did not return an authorization code. Start the connection again from the dashboard.",
  TokenExchangeFailed:
    "Tambo could not complete the authorization exchange with the OAuth provider. Try again.",
  Unknown: "Tambo could not finish the MCP authorization flow. Try again.",
} satisfies Record<OAuthErrorCode, string>;

export function getOAuthErrorMessage(code: string | undefined): string {
  const parsedCode = oauthErrorCodeSchema.safeParse(code);
  const resolvedCode = parsedCode.success ? parsedCode.data : "Unknown";

  return OAUTH_ERROR_MESSAGES[resolvedCode];
}
