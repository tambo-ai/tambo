import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { useTamboSessionToken } from "./use-tambo-session-token";
import type { PartialTamboAI } from "../../testing/types";

describe("useTamboSessionToken", () => {
  const mockTokenResponse = {
    access_token: "test-access-token",
    expires_in: 3600, // 1 hour
    token_type: "Bearer",
  };

  const mockAuthApi = {
    getToken: jest.fn(),
  } satisfies NonNullable<PartialTamboAI["beta"]>["auth"];

  const mockBeta = {
    auth: mockAuthApi,
  } satisfies PartialTamboAI["beta"];

  const mockTamboAI = {
    apiKey: "",
    beta: mockBeta,
    bearer: "",
  } satisfies PartialTamboAI as unknown as TamboAI;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    (mockTamboAI as any).bearer = "";
    queryClient.clear();
  });

  afterEach(async () => {
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it("should return null initially when no userToken is provided", () => {
    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, undefined),
    );

    expect(result.current).toMatchObject({
      data: undefined,
      isFetching: false,
    });
    expect(mockAuthApi.getToken).not.toHaveBeenCalled();
  });

  it("should fetch and return session token when userToken is provided", async () => {
    mockAuthApi.getToken.mockResolvedValue(mockTokenResponse);

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, "user-token"),
    );
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toMatchObject({
      data: mockTokenResponse,
      isFetching: false,
    });
    expect(mockTamboAI.bearer).toBe(mockTokenResponse.access_token);
    // Verify the hook was called with correct parameters
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(2);
    expect(mockAuthApi.getToken).toHaveBeenCalledWith(expect.any(Object));
  });

  it("should call getToken with correct token exchange parameters", async () => {
    mockAuthApi.getToken.mockResolvedValue(mockTokenResponse);

    renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, "user-token"),
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    const callArgs = mockAuthApi.getToken.mock.calls[0][0];
    const tokenRequestString = new TextDecoder().decode(callArgs);
    const tokenRequest = new URLSearchParams(tokenRequestString);

    expect(tokenRequest.get("grant_type")).toBe(
      "urn:ietf:params:oauth:grant-type:token-exchange",
    );
    expect(tokenRequest.get("subject_token")).toBe("user-token");
    expect(tokenRequest.get("subject_token_type")).toBe(
      "urn:ietf:params:oauth:token-type:access_token",
    );
  });

  it("should set bearer token on client", async () => {
    mockAuthApi.getToken.mockResolvedValue(mockTokenResponse);

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, "user-token"),
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toMatchObject({
      data: mockTokenResponse,
    });
    expect(mockTamboAI.bearer).toBe("test-access-token");
  });

  it("should handle different token responses", async () => {
    const customTokenResponse = {
      access_token: "custom-access-token",
      expires_in: 7200, // 2 hours
      token_type: "Bearer",
    };

    mockAuthApi.getToken.mockResolvedValue(customTokenResponse);

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, "user-token"),
    );
    expect(result.current).toMatchObject({
      data: undefined,
      isFetching: true,
    });

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toMatchObject({
      data: customTokenResponse,
      isFetching: false,
    });
    expect(mockTamboAI.bearer).toBe("custom-access-token");
  });

  it("should not fetch token when userToken changes to undefined", async () => {
    mockAuthApi.getToken.mockResolvedValue(mockTokenResponse);

    const { result, rerender } = renderHook(
      ({ userToken }) =>
        useTamboSessionToken(mockTamboAI, queryClient, userToken),
      {
        initialProps: { userToken: "user-token" as string | undefined },
      },
    );
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toMatchObject({
      data: mockTokenResponse,
      isFetching: false,
    });
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(2);

    // Clear mock and change userToken to undefined
    jest.clearAllMocks();

    act(() => {
      rerender({ userToken: undefined });
    });

    expect(mockAuthApi.getToken).not.toHaveBeenCalled();
  });

  it("should refetch token when userToken changes", async () => {
    mockAuthApi.getToken.mockResolvedValue(mockTokenResponse);

    const { result, rerender } = renderHook(
      ({ userToken }) =>
        useTamboSessionToken(mockTamboAI, queryClient, userToken),
      {
        initialProps: { userToken: "user-token-1" },
      },
    );
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toMatchObject({
      data: mockTokenResponse,
      isFetching: false,
    });
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(2);

    // Mock response for new token
    mockAuthApi.getToken.mockResolvedValue({
      ...mockTokenResponse,
      access_token: "new-access-token",
    });

    // Change userToken
    act(() => {
      rerender({ userToken: "user-token-2" });
    });

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toMatchObject({
      data: { access_token: "new-access-token" },
      isFetching: false,
    });
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(4);
  });

  it("should reset token when userToken becomes null", async () => {
    mockAuthApi.getToken.mockResolvedValue(mockTokenResponse);

    const { result, rerender } = renderHook(
      ({ userToken }) =>
        useTamboSessionToken(mockTamboAI, queryClient, userToken),
      {
        initialProps: { userToken: "user-token" as string | undefined },
      },
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toMatchObject({
      data: mockTokenResponse,
      isFetching: false,
    });

    // Change userToken to undefined
    rerender({ userToken: undefined });
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Token should reset to null (hook doesn't reset it to null when userToken is undefined)
    expect(result.current).toMatchObject({
      data: undefined,
      isFetching: false,
    });
  });

  it("should not update state if component is unmounted during token fetch", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockAuthApi.getToken.mockReturnValue(promise);

    const { result, unmount } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, "user-token"),
    );

    expect(result.current).toMatchObject({
      data: undefined,
      isFetching: true,
    });

    // Unmount before the promise resolves
    unmount();

    // Now resolve the promise
    act(() => {
      resolvePromise!(mockTokenResponse);
    });

    // Token should still be null since component was unmounted
    expect(result.current).toMatchObject({
      data: undefined,
      isFetching: true,
    });
  });

  it("should set isUpdating to true while fetching token", () => {
    mockAuthApi.getToken.mockImplementation(async () => {
      return await new Promise(() => {}); // Never resolves
    });

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, "user-token"),
    );

    // Should be updating immediately when userToken is provided
    expect(result.current).toMatchObject({
      data: undefined,
      isFetching: true,
    });
  });

  it("should set isUpdating to false after token fetch completes", async () => {
    mockAuthApi.getToken.mockResolvedValue(mockTokenResponse);

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, "user-token"),
    );

    // Should be updating initially
    expect(result.current).toMatchObject({
      data: undefined,
      isFetching: true,
    });

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    // Should not be updating after completion
    expect(result.current).toMatchObject({
      data: mockTokenResponse,
      isFetching: false,
    });
  });

  it("should set isUpdating to false after token fetch fails", async () => {
    mockAuthApi.getToken.mockRejectedValue(new Error("Token fetch failed"));

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, queryClient, "user-token"),
    );

    // Should be updating initially
    expect(result.current).toMatchObject({
      data: undefined,
      isFetching: true,
    });

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Should not be updating after failure
    expect(result.current).toMatchObject({
      data: undefined,
      error: expect.any(Error),
      isFetching: false,
    });
  });
});
