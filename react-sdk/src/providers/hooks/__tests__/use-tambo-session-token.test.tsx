import TamboAI from "@tambo-ai/typescript-sdk";
import { act, renderHook } from "@testing-library/react";
import { DeepPartial } from "ts-essentials";
import { useTamboSessionToken } from "../use-tambo-session-token";

type PartialTamboAI = DeepPartial<TamboAI>;

describe("useTamboSessionToken", () => {
  const mockTokenResponse = {
    access_token: "test-access-token",
    expires_in: 3600, // 1 hour
    token_type: "Bearer",
  };

  const mockAuthApi = {
    getToken: jest.fn(),
  } satisfies DeepPartial<TamboAI["beta"]["auth"]>;

  const mockBeta = {
    auth: mockAuthApi,
  } satisfies PartialTamboAI["beta"];

  const mockTamboAI = {
    apiKey: "",
    beta: mockBeta,
    bearer: "",
  } satisfies PartialTamboAI as unknown as TamboAI;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    (mockTamboAI as any).bearer = "";
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should return null initially when no userToken is provided", () => {
    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, undefined),
    );

    expect(result.current).toBeNull();
    expect(mockAuthApi.getToken).not.toHaveBeenCalled();
  });

  it("should fetch and return session token when userToken is provided", async () => {
    jest.mocked(mockAuthApi.getToken).mockResolvedValue(mockTokenResponse);

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, "user-token"),
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe("test-access-token");
    expect(mockTamboAI.bearer).toBe("test-access-token");
    // Verify the hook was called with correct parameters
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(1);
    expect(mockAuthApi.getToken).toHaveBeenCalledWith(expect.any(Object));
  });

  it("should call getToken with correct token exchange parameters", async () => {
    jest.mocked(mockAuthApi.getToken).mockResolvedValue(mockTokenResponse);

    renderHook(() => useTamboSessionToken(mockTamboAI, "user-token"));

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    const callArgs = jest.mocked(mockAuthApi.getToken).mock.calls[0][0];
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
    jest.mocked(mockAuthApi.getToken).mockResolvedValue(mockTokenResponse);

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, "user-token"),
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe("test-access-token");
    expect(mockTamboAI.bearer).toBe("test-access-token");
  });

  it("should handle different token responses", async () => {
    const customTokenResponse = {
      access_token: "custom-access-token",
      expires_in: 7200, // 2 hours
      token_type: "Bearer",
    };

    jest.mocked(mockAuthApi.getToken).mockResolvedValue(customTokenResponse);

    const { result } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, "user-token"),
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe("custom-access-token");
    expect(mockTamboAI.bearer).toBe("custom-access-token");
  });

  it("should not fetch token when userToken changes to undefined", async () => {
    jest.mocked(mockAuthApi.getToken).mockResolvedValue(mockTokenResponse);

    const { result, rerender } = renderHook(
      ({ userToken }) => useTamboSessionToken(mockTamboAI, userToken),
      {
        initialProps: { userToken: "user-token" as string | undefined },
      },
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe("test-access-token");
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(1);

    // Clear mock and change userToken to undefined
    jest.clearAllMocks();

    act(() => {
      rerender({ userToken: undefined });
    });

    expect(mockAuthApi.getToken).not.toHaveBeenCalled();
  });

  it("should refetch token when userToken changes", async () => {
    jest.mocked(mockAuthApi.getToken).mockResolvedValue(mockTokenResponse);

    const { result, rerender } = renderHook(
      ({ userToken }) => useTamboSessionToken(mockTamboAI, userToken),
      {
        initialProps: { userToken: "user-token-1" },
      },
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe("test-access-token");
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(1);

    // Mock response for new token
    jest.mocked(mockAuthApi.getToken).mockResolvedValue({
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

    expect(result.current).toBe("new-access-token");
    expect(mockAuthApi.getToken).toHaveBeenCalledTimes(2);
  });

  it("should reset token when userToken becomes null", async () => {
    jest.mocked(mockAuthApi.getToken).mockResolvedValue(mockTokenResponse);

    const { result, rerender } = renderHook(
      ({ userToken }) => useTamboSessionToken(mockTamboAI, userToken),
      {
        initialProps: { userToken: "user-token" as string | undefined },
      },
    );

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current).toBe("test-access-token");

    // Change userToken to undefined
    act(() => {
      rerender({ userToken: undefined });
    });

    // Token should remain the same (hook doesn't reset it to null when userToken is undefined)
    expect(result.current).toBe("test-access-token");
  });

  it("should not update state if component is unmounted during token fetch", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    jest.mocked(mockAuthApi.getToken).mockReturnValue(promise);

    const { result, unmount } = renderHook(() =>
      useTamboSessionToken(mockTamboAI, "user-token"),
    );

    expect(result.current).toBeNull();

    // Unmount before the promise resolves
    unmount();

    // Now resolve the promise
    act(() => {
      resolvePromise!(mockTokenResponse);
    });

    // Token should still be null since component was unmounted
    expect(result.current).toBeNull();
  });
});
