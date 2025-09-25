"use client";
import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * This internal hook is used to get the Tambo session token and keep it
 * refreshed.
 *
 * It will refresh the token when it expires.
 * It will also set the bearer token on the client.
 *
 * This hook is used by the TamboClientProvider.
 * @param client - The Tambo client.
 * @param queryClient - The query client.
 * @param userToken - The third-party OAuth token to exchange for a Tambo session.
 * @returns React Query result for the session token (token data, fetching state, errors).
 */
export function useTamboSessionToken(
  client: TamboAI,
  queryClient: QueryClient,
  userToken: string | undefined,
) {
  const result = useQuery(
    {
      queryKey: ["tambo-session-token", userToken],
      queryFn: async () => {
        const tokenRequest = {
          grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
          // will only be undefined if the userToken is not provided, in which case the query will be disabled.
          subject_token: userToken!,
          subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
        };
        const tokenRequestFormEncoded = new URLSearchParams(
          tokenRequest,
        ).toString();
        const tokenAsArrayBuffer = new TextEncoder().encode(
          tokenRequestFormEncoded,
        );
        return await client.beta.auth.getToken(tokenAsArrayBuffer as any);
      },
      enabled: !!userToken,
      refetchInterval: (result) => {
        if (result.state.data?.expires_in) {
          return result.state.data.expires_in * 1000;
        }
        return false;
      },
    },
    queryClient,
  );
  const accessToken = result.data?.access_token ?? null;
  useEffect(() => {
    client.bearer = accessToken;
  }, [accessToken, client]);
  return result;
}
