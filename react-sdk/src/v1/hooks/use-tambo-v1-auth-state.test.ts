import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient } from "@tanstack/react-query";
import TamboAI from "@tambo-ai/typescript-sdk";
import { TamboClientContext } from "../../providers/tambo-client-provider";
import type { TamboClientContextProps } from "../../providers/tambo-client-provider";
import {
  TamboV1ConfigContext,
  type TamboV1Config,
} from "../providers/tambo-v1-provider";
import { useTamboV1AuthState } from "./use-tambo-v1-auth-state";

function createWrapper(
  clientOverrides: Partial<TamboClientContextProps>,
  configOverrides: Partial<TamboV1Config> = {},
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

  const config: TamboV1Config = {
    userKey: undefined,
    ...configOverrides,
  };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      TamboClientContext.Provider,
      { value: clientContext },
      React.createElement(
        TamboV1ConfigContext.Provider,
        { value: config },
        children,
      ),
    );
  }
  return Wrapper;
}

describe("useTamboV1AuthState", () => {
  it("returns 'identified' with source 'userKey' when only userKey is provided", () => {
    const { result } = renderHook(() => useTamboV1AuthState(), {
      wrapper: createWrapper({}, { userKey: "user_123" }),
    });

    expect(result.current).toEqual({
      status: "identified",
      source: "userKey",
    });
  });

  it("returns 'identified' with source 'tokenExchange' when token exchange succeeded", () => {
    const { result } = renderHook(() => useTamboV1AuthState(), {
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
    const { result } = renderHook(() => useTamboV1AuthState(), {
      wrapper: createWrapper({
        userToken: "oauth_token",
        hasValidToken: false,
      }),
    });

    expect(result.current).toEqual({ status: "exchanging" });
  });

  it("returns 'error' when token exchange failed", () => {
    const exchangeError = new Error("Token exchange failed");
    const { result } = renderHook(() => useTamboV1AuthState(), {
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
    const { result } = renderHook(() => useTamboV1AuthState(), {
      wrapper: createWrapper(
        { userToken: "oauth_token" },
        { userKey: "user_123" },
      ),
    });

    expect(result.current).toEqual({ status: "invalid" });
  });

  it("returns 'unauthenticated' when neither userKey nor userToken is provided", () => {
    const { result } = renderHook(() => useTamboV1AuthState(), {
      wrapper: createWrapper({}),
    });

    expect(result.current).toEqual({ status: "unauthenticated" });
  });

  it("throws when used outside TamboClientContext", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        TamboV1ConfigContext.Provider,
        { value: { userKey: "x" } },
        children,
      );

    expect(() => renderHook(() => useTamboV1AuthState(), { wrapper })).toThrow(
      "useTamboV1AuthState must be used within TamboV1Provider",
    );
  });

  it("throws when used outside TamboV1ConfigContext", () => {
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

    expect(() => renderHook(() => useTamboV1AuthState(), { wrapper })).toThrow(
      "useTamboV1AuthState must be used within TamboV1Provider",
    );
  });
});
