"use client";
import TamboAI, { ClientOptions } from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import packageJson from "../../package.json";

export interface TamboClientProviderProps {
  /**
   * The URL of the Tambo API (only used for local development and debugging)
   */
  tamboUrl?: string;
  /**
   * The API key for the Tambo API. This typically comes from a variable like
   * `process.env.NEXT_PUBLIC_TAMBO_API_KEY`
   */
  apiKey: string;
  /**
   * The environment to use for the Tambo API
   */
  environment?: "production" | "staging";

  /**
   * The user token to use to identify the user in the Tambo API. This token is
   * a 3rd party token like a Google or GitHub access token, exchanged with the
   * Tambo API to get a session token. This is used to securely identify the
   * user when calling the Tambo API.
   */
  userToken?: string;
}

export interface TamboClientContextProps {
  /** The TamboAI client */
  client: TamboAI;
  /** The tambo-specific query client */
  queryClient: QueryClient;
}

export const TamboClientContext = createContext<
  TamboClientContextProps | undefined
>(undefined);

/**
 * The TamboClientProvider is a React provider that provides a TamboAI client
 * and a query client to the descendants of the provider.
 * @param props - The props for the TamboClientProvider
 * @param props.children - The children to wrap
 * @param props.tamboUrl - The URL of the Tambo API
 * @param props.apiKey - The API key for the Tambo API
 * @param props.environment - The environment to use for the Tambo API
 * @param props.userToken - The oauth access token to use to identify the user in the Tambo API
 * @returns The TamboClientProvider component
 */
export const TamboClientProvider: React.FC<
  PropsWithChildren<TamboClientProviderProps>
> = ({ children, tamboUrl, apiKey, environment, userToken }) => {
  const tamboConfig: ClientOptions = {
    apiKey,
    defaultHeaders: {
      "X-Tambo-React-Version": packageJson.version,
    },
  };
  if (tamboUrl) {
    tamboConfig.baseURL = tamboUrl;
  }
  if (environment) {
    tamboConfig.environment = environment;
  }
  const [client] = useState(() => new TamboAI(tamboConfig));
  const [queryClient] = useState(() => new QueryClient());

  // Keep the session token updated
  useTamboSessionToken(client, userToken);

  return (
    <TamboClientContext.Provider value={{ client, queryClient }}>
      {children}
    </TamboClientContext.Provider>
  );
};

/**
 * The useTamboClient hook provides access to the TamboAI client
 * to the descendants of the TamboClientProvider.
 * @returns The TamboAI client
 */
export const useTamboClient = () => {
  const context = React.useContext(TamboClientContext);
  if (context === undefined) {
    throw new Error("useTamboClient must be used within a TamboClientProvider");
  }
  return context.client;
};

/**
 * The useTamboQueryClient hook provides access to the tambo-specific query client
 * to the descendants of the TamboClientProvider.
 * @returns The tambo-specific query client
 * @private
 */
export const useTamboQueryClient = () => {
  const context = React.useContext(TamboClientContext);
  if (context === undefined) {
    throw new Error(
      "useTamboQueryClient must be used within a TamboClientProvider",
    );
  }
  return context.queryClient;
};

function useTamboSessionToken(client: TamboAI, userToken: string | undefined) {
  const [tamboSessionToken, setTamboSessionToken] = useState<string | null>(
    null,
  );
  // we need to set this to true when the token is expired, this is effectively
  // like a dirty bit, which will trigger a new useEffect()
  const [isExpired, setIsExpired] = useState(true);
  useEffect(() => {
    let expireTimer: NodeJS.Timeout | null = null;

    async function updateToken(
      subjectToken: string,
      abortController: AbortController,
    ) {
      if (abortController.signal.aborted || !userToken) {
        return;
      }
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
      const tamboToken = await client.beta.auth.getToken(
        tokenAsArrayBuffer as any,
      );

      if (abortController.signal.aborted) {
        return;
      }
      setTamboSessionToken(tamboToken.access_token);
      client.bearer = tamboToken.access_token;

      // we need to set a timer to refresh the token when it expires
      const refreshTime = Math.max(tamboToken.expires_in - 60, 0);

      // careful with the assignment here: since this is an async function, this
      // code is executed outside the of the scope of the useEffect() hook, so
      // we need to use a let variable to store the timer
      expireTimer = setTimeout(() => {
        setIsExpired(true);
      }, refreshTime * 1000);
    }

    const abortController = new AbortController();
    if (userToken && isExpired) {
      updateToken(userToken, abortController);
    }

    return () => {
      // This fires when the component unmounts or the userToken changes
      abortController.abort();
      if (expireTimer) {
        clearTimeout(expireTimer);
      }
    };
  }, [client, isExpired, userToken]);

  return tamboSessionToken;
}
