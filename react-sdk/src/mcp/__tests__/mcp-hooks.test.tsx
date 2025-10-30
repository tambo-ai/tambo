import { render, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { TamboClientContext } from "../../providers/tambo-client-provider";
import { TamboMcpTokenProvider } from "../../providers/tambo-mcp-token-provider";
import { TamboRegistryProvider } from "../../providers/tambo-registry-provider";
import { MCPTransport } from "../mcp-client";
import { TamboMcpProvider, useTamboMcpServers } from "../tambo-mcp-provider";
import { useTamboMcpPromptList, type ListPromptEntry } from "../mcp-hooks";

// Mock the MCP client to avoid ES module issues
let createImpl: jest.Mock<any, any> = jest.fn();
jest.mock("../mcp-client", () => ({
  MCPClient: { create: (...args: any[]) => createImpl(...args) },
  MCPTransport: { SSE: "sse", HTTP: "http" },
}));

describe("useTamboMcpPromptList - individual server caching", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    createImpl = jest.fn();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should fetch and combine prompts from multiple servers", async () => {
    // Mock two servers with different prompts
    const serverAPrompts = {
      prompts: [
        { name: "prompt-a1", description: "Prompt A1" },
        { name: "prompt-a2", description: "Prompt A2" },
      ],
    };
    const serverBPrompts = {
      prompts: [
        { name: "prompt-b1", description: "Prompt B1" },
        { name: "prompt-b2", description: "Prompt B2" },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverAPrompts),
      close: jest.fn(),
    };
    const mockClientB = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverBPrompts),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };
    const clientB = {
      client: mockClientB,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    // Mock MCPClient.create to return different clients for different URLs
    createImpl.mockImplementation(async (url: string) => {
      if (url === "https://server-a.example") return clientA;
      if (url === "https://server-b.example") return clientB;
      throw new Error(`Unexpected URL: ${url}`);
    });

    let capturedPrompts: ListPromptEntry[] = [];
    const Capture: React.FC = () => {
      const { data: prompts } = useTamboMcpPromptList();
      useEffect(() => {
        if (prompts) {
          capturedPrompts = prompts;
        }
      }, [prompts]);
      return null;
    };

    render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider>
          <TamboMcpTokenProvider>
            <TamboMcpProvider
              mcpServers={[
                {
                  url: "https://server-a.example",
                  transport: MCPTransport.SSE,
                },
                {
                  url: "https://server-b.example",
                  transport: MCPTransport.SSE,
                },
              ]}
            >
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for all prompts to be loaded
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(4);
    });

    // Verify all prompts are present
    const promptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(promptNames).toContain("prompt-a1");
    expect(promptNames).toContain("prompt-a2");
    expect(promptNames).toContain("prompt-b1");
    expect(promptNames).toContain("prompt-b2");

    // Verify each prompt has the correct server info
    const promptA1 = capturedPrompts.find((p) => p.prompt.name === "prompt-a1");
    expect(promptA1?.server.url).toBe("https://server-a.example");

    const promptB1 = capturedPrompts.find((p) => p.prompt.name === "prompt-b1");
    expect(promptB1?.server.url).toBe("https://server-b.example");
  });

  it("should remove prompts when a server is removed", async () => {
    // Mock two servers with different prompts
    const serverAPrompts = {
      prompts: [
        { name: "prompt-a1", description: "Prompt A1" },
        { name: "prompt-a2", description: "Prompt A2" },
      ],
    };
    const serverBPrompts = {
      prompts: [
        { name: "prompt-b1", description: "Prompt B1" },
        { name: "prompt-b2", description: "Prompt B2" },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverAPrompts),
      close: jest.fn(),
    };
    const mockClientB = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverBPrompts),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };
    const clientB = {
      client: mockClientB,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    createImpl.mockImplementation(async (url: string) => {
      if (url === "https://server-a.example") return clientA;
      if (url === "https://server-b.example") return clientB;
      throw new Error(`Unexpected URL: ${url}`);
    });

    let capturedPrompts: ListPromptEntry[] = [];
    const Capture: React.FC = () => {
      const { data: prompts } = useTamboMcpPromptList();
      useEffect(() => {
        if (prompts) {
          capturedPrompts = prompts;
        }
      }, [prompts]);
      return null;
    };

    const { rerender } = render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider>
          <TamboMcpTokenProvider>
            <TamboMcpProvider
              mcpServers={[
                {
                  url: "https://server-a.example",
                  transport: MCPTransport.SSE,
                },
                {
                  url: "https://server-b.example",
                  transport: MCPTransport.SSE,
                },
              ]}
            >
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for initial prompts to be loaded
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(4);
    });

    const initialPromptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(initialPromptNames).toContain("prompt-a1");
    expect(initialPromptNames).toContain("prompt-a2");
    expect(initialPromptNames).toContain("prompt-b1");
    expect(initialPromptNames).toContain("prompt-b2");

    // Remove server B
    rerender(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider>
          <TamboMcpTokenProvider>
            <TamboMcpProvider
              mcpServers={[
                {
                  url: "https://server-a.example",
                  transport: MCPTransport.SSE,
                },
              ]}
            >
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for prompts to be updated (server B prompts should disappear)
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(2);
    });

    const updatedPromptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(updatedPromptNames).toContain("prompt-a1");
    expect(updatedPromptNames).toContain("prompt-a2");
    expect(updatedPromptNames).not.toContain("prompt-b1");
    expect(updatedPromptNames).not.toContain("prompt-b2");

    // Verify server B's client was closed
    expect(clientB.close).toHaveBeenCalled();
  });

  it("should cache prompts individually per server using server key", async () => {
    const serverAPrompts = {
      prompts: [{ name: "prompt-a", description: "Prompt A" }],
    };
    const serverBPrompts = {
      prompts: [{ name: "prompt-b", description: "Prompt B" }],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverAPrompts),
      close: jest.fn(),
    };
    const mockClientB = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverBPrompts),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };
    const clientB = {
      client: mockClientB,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    createImpl.mockImplementation(async (url: string) => {
      if (url === "https://server-a.example") return clientA;
      if (url === "https://server-b.example") return clientB;
      throw new Error(`Unexpected URL: ${url}`);
    });

    let capturedPrompts: ListPromptEntry[] = [];
    let capturedServerKeys: string[] = [];
    const Capture: React.FC = () => {
      const { data: prompts } = useTamboMcpPromptList();
      const servers = useTamboMcpServers();
      useEffect(() => {
        if (prompts) {
          capturedPrompts = prompts;
        }
        capturedServerKeys = servers.map((s) => s.key);
      }, [prompts, servers]);
      return null;
    };

    render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider>
          <TamboMcpTokenProvider>
            <TamboMcpProvider
              mcpServers={[
                {
                  url: "https://server-a.example",
                  transport: MCPTransport.SSE,
                },
                {
                  url: "https://server-b.example",
                  transport: MCPTransport.SSE,
                },
              ]}
            >
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for prompts to be loaded
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(2);
    });

    // Verify that listPrompts was called once per server
    expect(mockClientA.listPrompts).toHaveBeenCalledTimes(1);
    expect(mockClientB.listPrompts).toHaveBeenCalledTimes(1);

    // Verify the query cache has separate entries for each server
    const cacheKeys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);

    // Should have separate cache entries for each server's prompts
    const promptCacheKeys = cacheKeys.filter(
      (key) => Array.isArray(key) && key[0] === "mcp-prompts",
    );
    expect(promptCacheKeys.length).toBe(2);
    // Ensure provider keys are populated before asserting
    await waitFor(() => expect(capturedServerKeys.length).toBe(2));

    // Verify each connected server key is present exactly once in the cache keys
    const promptKeySet = new Set(promptCacheKeys.map((k) => String(k[1])));
    // The server keys are captured from the provider to avoid relying on string substrings
    capturedServerKeys.forEach((key) => {
      expect(promptKeySet.has(key)).toBe(true);
    });
    // And no duplicates
    expect(promptKeySet.size).toBe(capturedServerKeys.length);
  });

  it("should handle server errors gracefully without affecting other servers", async () => {
    const serverAPrompts = {
      prompts: [{ name: "prompt-a", description: "Prompt A" }],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverAPrompts),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    // Server B will fail to connect
    createImpl.mockImplementation(async (url: string) => {
      if (url === "https://server-a.example") return clientA;
      if (url === "https://server-b.example") {
        throw new Error("Connection failed");
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    let capturedPrompts: ListPromptEntry[] = [];
    let mcpServersCount = 0;
    const Capture: React.FC = () => {
      const { data: prompts } = useTamboMcpPromptList();
      const servers = useTamboMcpServers();
      useEffect(() => {
        if (prompts) {
          capturedPrompts = prompts;
        }
        mcpServersCount = servers.length;
      }, [prompts, servers]);
      return null;
    };

    render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider>
          <TamboMcpTokenProvider>
            <TamboMcpProvider
              mcpServers={[
                {
                  url: "https://server-a.example",
                  transport: MCPTransport.SSE,
                },
                {
                  url: "https://server-b.example",
                  transport: MCPTransport.SSE,
                },
              ]}
            >
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for server A prompts to be loaded
    // Server B should fail but not block server A
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(1);
      expect(mcpServersCount).toBe(2); // Both servers should be in the list
    });

    // Verify only server A's prompts are present
    const promptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(promptNames).toContain("prompt-a");
    expect(promptNames).not.toContain("prompt-b");
  });

  it("should add prompts when a new server is added", async () => {
    const serverAPrompts = {
      prompts: [{ name: "prompt-a", description: "Prompt A" }],
    };
    const serverBPrompts = {
      prompts: [{ name: "prompt-b", description: "Prompt B" }],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverAPrompts),
      close: jest.fn(),
    };
    const mockClientB = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverBPrompts),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };
    const clientB = {
      client: mockClientB,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    createImpl.mockImplementation(async (url: string) => {
      if (url === "https://server-a.example") return clientA;
      if (url === "https://server-b.example") return clientB;
      throw new Error(`Unexpected URL: ${url}`);
    });

    let capturedPrompts: ListPromptEntry[] = [];
    const Capture: React.FC = () => {
      const { data: prompts } = useTamboMcpPromptList();
      useEffect(() => {
        if (prompts) {
          capturedPrompts = prompts;
        }
      }, [prompts]);
      return null;
    };

    const { rerender } = render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider>
          <TamboMcpTokenProvider>
            <TamboMcpProvider
              mcpServers={[
                {
                  url: "https://server-a.example",
                  transport: MCPTransport.SSE,
                },
              ]}
            >
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for initial prompts from server A
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(1);
    });

    expect(capturedPrompts.map((p) => p.prompt.name)).toContain("prompt-a");

    // Add server B
    rerender(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider>
          <TamboMcpTokenProvider>
            <TamboMcpProvider
              mcpServers={[
                {
                  url: "https://server-a.example",
                  transport: MCPTransport.SSE,
                },
                {
                  url: "https://server-b.example",
                  transport: MCPTransport.SSE,
                },
              ]}
            >
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for server B prompts to be added
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(2);
    });

    const promptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(promptNames).toContain("prompt-a");
    expect(promptNames).toContain("prompt-b");
  });
});
