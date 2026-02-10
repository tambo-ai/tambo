import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient } from "@tanstack/react-query";
import TamboAI from "@tambo-ai/typescript-sdk";
import { TamboClientContext } from "../../providers/tambo-client-provider";
import type { TamboClientContextProps } from "../../providers/tambo-client-provider";
import {
  TamboConfigContext,
  type TamboConfig,
} from "../providers/tambo-v1-provider";
import { useTamboAuthState } from "./use-tambo-v1-auth-state";

function createWrapper(
  clientOverrides: Partial<TamboClientContextProps>,
  configOverrides: Partial<TamboConfig> = {},
) {
  const clientContext: TamboClientContextProps = {
    client: {} as TamboAI,
    queryClient: new QueryClient(),
    isUpdatingToken: false,
    tokenExchangeError: null,
    userToken: undefined,
    hasValidToken: false,
    ...clientOverrides,
  };

  const config: TamboConfig = {
    userKey: undefined,
    ...configOverrides,
  };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      TamboClientContext.Provider,
      { value: clientContext },
      React.createElement(
        TamboConfigContext.Provider,
        { value: config },
        children,
      ),
    );
  }
  return Wrapper;
}

describe("useTamboAuthState", () => {
  it("returns 'identified' with source 'userKey' when only userKey is provided", () => {
    const { result } = renderHook(() => useTamboAuthState(), {
      wrapper: createWrapper({}, { userKey: "user_123" }),
    });

    expect(result.current).toEqual({
      status: "identified",
      source: "userKey",
    });
  });

  it("returns 'identified' with source 'tokenExchange' when token exchange succeeded", () => {
    const { result } = renderHook(() => useTamboAuthState(), {
      wrapper: createWrapper({
        userToken: "oauth_token",
        hasValidToken: true,
      }),
    });

    expect(result.current).toEqual({
      status: "identified",
      source: "tokenExchange",
    });
  });

  it("returns 'exchanging' when userToken provided but exchange not yet complete", () => {
    const { result } = renderHook(() => useTamboAuthState(), {
      wrapper: createWrapper({
        userToken: "oauth_token",
        hasValidToken: false,
      }),
    });

    expect(result.current).toEqual({ status: "exchanging" });
  });

  it("returns 'error' when token exchange failed", () => {
    const exchangeError = new Error("Token exchange failed");
    const { result } = renderHook(() => useTamboAuthState(), {
      wrapper: createWrapper({
        userToken: "oauth_token",
        tokenExchangeError: exchangeError,
        hasValidToken: false,
      }),
    });

    expect(result.current).toEqual({
      status: "error",
      error: exchangeError,
    });
  });

  it("returns 'invalid' when both userKey and userToken are provided", () => {
    const { result } = renderHook(() => useTamboAuthState(), {
      wrapper: createWrapper(
        { userToken: "oauth_token" },
        { userKey: "user_123" },
      ),
    });

    expect(result.current).toEqual({ status: "invalid" });
  });

  it("returns 'unauthenticated' when neither userKey nor userToken is provided", () => {
    const { result } = renderHook(() => useTamboAuthState(), {
      wrapper: createWrapper({}),
    });

    expect(result.current).toEqual({ status: "unauthenticated" });
  });

  it("throws when used outside TamboClientContext", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        TamboConfigContext.Provider,
        { value: { userKey: "x" } },
        children,
      );

    expect(() => renderHook(() => useTamboAuthState(), { wrapper })).toThrow(
      "useTamboAuthState must be used within TamboProvider",
    );
  });

  it("throws when used outside TamboConfigContext", () => {
    const clientContext: TamboClientContextProps = {
      client: {} as TamboAI,
      queryClient: new QueryClient(),
      isUpdatingToken: false,
      tokenExchangeError: null,
      userToken: undefined,
      hasValidToken: false,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        TamboClientContext.Provider,
        { value: clientContext },
        children,
      );

    expect(() => renderHook(() => useTamboAuthState(), { wrapper })).toThrow(
      "useTamboAuthState must be used within TamboProvider",
    );
  });
});
