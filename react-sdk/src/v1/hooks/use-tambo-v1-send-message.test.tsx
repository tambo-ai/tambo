import TamboAI from "@tambo-ai/typescript-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { TamboRegistryContext } from "../../providers/tambo-registry-provider";
import { TamboV1StreamProvider } from "../providers/tambo-v1-stream-context";
import { useTamboV1SendMessage } from "./use-tambo-v1-send-message";

jest.mock("../../providers/tambo-client-provider", () => ({
  useTamboClient: jest.fn(),
}));

describe("useTamboV1SendMessage", () => {
  const mockThreadsRunsApi = {
    run: jest.fn(),
    create: jest.fn(),
  };

  const mockTamboAI = {
    apiKey: "",
    threads: {
      runs: mockThreadsRunsApi,
    },
  } as unknown as TamboAI;

  const mockRegistry = {
    componentList: new Map(),
    toolRegistry: new Map(),
  };

  let queryClient: QueryClient;

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TamboRegistryContext.Provider value={mockRegistry as any}>
          <TamboV1StreamProvider threadId="thread_123">
            {children}
          </TamboV1StreamProvider>
        </TamboRegistryContext.Provider>
      </QueryClientProvider>
    );
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.mocked(useTamboClient).mockReturnValue(mockTamboAI);
    mockThreadsRunsApi.run.mockReset();
    mockThreadsRunsApi.create.mockReset();
  });

  it("returns a mutation object", () => {
    const { result } = renderHook(() => useTamboV1SendMessage("thread_123"), {
      wrapper: TestWrapper,
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it("returns a mutation object when threadId is not provided", () => {
    const { result } = renderHook(() => useTamboV1SendMessage(), {
      wrapper: TestWrapper,
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });
});
