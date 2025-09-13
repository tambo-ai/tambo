import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, useQuery } from "@tanstack/vue-query";
import { watchEffect } from "vue";

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
          subject_token: userToken!,
          subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
        } as const;
        const tokenRequestFormEncoded = new URLSearchParams(tokenRequest).toString();
        const tokenAsArrayBuffer = new TextEncoder().encode(tokenRequestFormEncoded);
        return await client.beta.auth.getToken(tokenAsArrayBuffer as any);
      },
      enabled: !!userToken,
      refetchInterval: (result) => {
        if ((result.state.data as any)?.expires_in) {
          return ((result.state.data as any).expires_in as number) * 1000;
        }
        return false;
      },
    },
    queryClient,
  );

  const accessToken = (result.data as any)?.access_token ?? null;
  watchEffect(() => {
    (client as any).bearer = accessToken;
  });

  return result;
}

