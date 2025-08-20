"use client";
import TamboAI from "@tambo-ai/typescript-sdk";
import { useEffect, useState } from "react";

/**
 * This internal hook is used to get the Tambo session token and keep it
 * refreshed.
 *
 * It will refresh the token when it expires.
 * It will also set the bearer token on the client.
 *
 * This hook is used by the TamboClientProvider.
 * @param client - The Tambo client.
 * @param userToken - The user token.
 * @returns The Tambo session token.
 */
export function useTamboSessionToken(
  client: TamboAI,
  userToken: string | undefined,
) {
  const [tamboSessionToken, setTamboSessionToken] = useState<string | null>(
    null,
  );
  // we need to set this to true when the token is expired, this is effectively
  // like a dirty bit, which will trigger a new useEffect()
  const [isExpired, setIsExpired] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  useEffect(() => {
    let expireTimer: NodeJS.Timeout | null = null;

    async function updateToken(
      subjectToken: string,
      abortController: AbortController,
    ) {
      if (abortController.signal.aborted || !userToken) {
        return;
      }

      setIsUpdating(true);
      const tokenRequest = {
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        subject_token: subjectToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
      };
      const tokenRequestFormEncoded = new URLSearchParams(
        tokenRequest,
      ).toString();
      const tokenAsArrayBuffer = new TextEncoder().encode(
        tokenRequestFormEncoded,
      );

      try {
        const tamboToken = await client.beta.auth.getToken(
          tokenAsArrayBuffer as any,
        );

        if (abortController.signal.aborted) {
          return;
        }
        setTamboSessionToken(tamboToken.access_token);
        client.bearer = tamboToken.access_token;
        setIsExpired(false);

        // we need to set a timer to refresh the token when it expires
        const refreshTime = Math.max(tamboToken.expires_in - 60, 0);

        // careful with the assignment here: since this is an async function, this
        // code is executed outside the of the scope of the useEffect() hook, so
        // we need to use a let variable to store the timer
        expireTimer = setTimeout(() => {
          setIsExpired(true);
        }, refreshTime * 1000);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Failed to get token:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsUpdating(false);
        }
      }
    }

    const abortController = new AbortController();
    if (userToken && isExpired) {
      updateToken(userToken, abortController);
    } else if (!userToken) {
      setIsUpdating(false);
    }

    return () => {
      // This fires when the component unmounts or the userToken changes
      abortController.abort();
      if (expireTimer) {
        clearTimeout(expireTimer);
      }
      setIsUpdating(false);
    };
  }, [client, isExpired, userToken]);

  return { tamboSessionToken, isUpdating };
}
