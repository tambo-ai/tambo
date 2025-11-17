import { QueryClient } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import React, { useEffect } from "react";
import { MCPTransport } from "../../model/mcp-server-info";
import { TamboClientContext } from "../../providers/tambo-client-provider";
import { TamboMcpTokenProvider } from "../../providers/tambo-mcp-token-provider";
import { TamboRegistryProvider } from "../../providers/tambo-registry-provider";
import {
  useTamboMcpPromptList,
  useTamboMcpResource,
  useTamboMcpResourceList,
  type ListPromptEntry,
  type ListResourceEntry,
} from "../mcp-hooks";
import { TamboMcpProvider, useTamboMcpServers } from "../tambo-mcp-provider";

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
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
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
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for all prompts to be loaded
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(4);
    });

    // Verify all prompts are present (with prefixes since we have 2 servers)
    const promptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(promptNames).toContain("server-a:prompt-a1");
    expect(promptNames).toContain("server-a:prompt-a2");
    expect(promptNames).toContain("server-b:prompt-b1");
    expect(promptNames).toContain("server-b:prompt-b2");

    // Verify each prompt has the correct server info
    const promptA1 = capturedPrompts.find(
      (p) => p.prompt.name === "server-a:prompt-a1",
    );
    expect(promptA1?.server.url).toBe("https://server-a.example");

    const promptB1 = capturedPrompts.find(
      (p) => p.prompt.name === "server-b:prompt-b1",
    );
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
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
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
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for initial prompts to be loaded
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(4);
    });

    const initialPromptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(initialPromptNames).toContain("server-a:prompt-a1");
    expect(initialPromptNames).toContain("server-a:prompt-a2");
    expect(initialPromptNames).toContain("server-b:prompt-b1");
    expect(initialPromptNames).toContain("server-b:prompt-b2");

    // Remove server B
    rerender(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
            mcpServers={[
              {
                url: "https://server-a.example",
                transport: MCPTransport.SSE,
              },
            ]}
          >
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for prompts to be updated (server B prompts should disappear)
    // When only 1 server remains, prompts should NOT be prefixed
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(2);
    });

    const updatedPromptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(updatedPromptNames).toContain("prompt-a1");
    expect(updatedPromptNames).toContain("prompt-a2");
    expect(updatedPromptNames).not.toContain("prompt-b1");
    expect(updatedPromptNames).not.toContain("prompt-b2");
    expect(updatedPromptNames).not.toContain("server-a:prompt-a1"); // No prefix when only 1 server

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
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
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
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
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
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
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
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for server A prompts to be loaded
    // Server B should fail but not block server A
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(1);
      expect(mcpServersCount).toBe(2); // Both servers should be in the list
    });

    // Verify only server A's prompts are present (with prefix since 2 servers configured)
    const promptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(promptNames).toContain("server-a:prompt-a");
    expect(promptNames).not.toContain("server-b:prompt-b");
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
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
            mcpServers={[
              {
                url: "https://server-a.example",
                transport: MCPTransport.SSE,
              },
            ]}
          >
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
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
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
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
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for server B prompts to be added
    // Now with 2 servers, prompts should be prefixed
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(2);
    });

    const promptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(promptNames).toContain("server-a:prompt-a");
    expect(promptNames).toContain("server-b:prompt-b");
  });
});

describe("useTamboMcpResourceList - resource management", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    createImpl = jest.fn();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should fetch and combine resources from multiple servers", async () => {
    // Mock two servers with different resources
    const serverAResources = {
      resources: [
        {
          uri: "file:///home/user/doc1.txt",
          name: "Document 1",
          mimeType: "text/plain",
        },
        {
          uri: "file:///home/user/doc2.txt",
          name: "Document 2",
          mimeType: "text/plain",
        },
      ],
    };
    const serverBResources = {
      resources: [
        {
          uri: "file:///workspace/code.js",
          name: "Code File",
          mimeType: "text/javascript",
        },
        {
          uri: "file:///workspace/README.md",
          name: "Readme",
          mimeType: "text/markdown",
        },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
      listResources: jest.fn().mockResolvedValue(serverAResources),
      close: jest.fn(),
    };
    const mockClientB = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
      listResources: jest.fn().mockResolvedValue(serverBResources),
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

    let capturedResources: ListResourceEntry[] = [];
    const Capture: React.FC = () => {
      const { data: resources } = useTamboMcpResourceList();
      useEffect(() => {
        if (resources) {
          capturedResources = resources;
        }
      }, [resources]);
      return null;
    };

    render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
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
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for all resources to be loaded
    await waitFor(() => {
      expect(capturedResources.length).toBe(4);
    });

    // Verify all resources are present (with prefixes since we have 2 servers)
    const resourceUris = capturedResources.map((r) => r.resource.uri);
    expect(resourceUris).toContain("server-a:file:///home/user/doc1.txt");
    expect(resourceUris).toContain("server-a:file:///home/user/doc2.txt");
    expect(resourceUris).toContain("server-b:file:///workspace/code.js");
    expect(resourceUris).toContain("server-b:file:///workspace/README.md");

    // Verify each resource has the correct server info
    const resource1 = capturedResources.find(
      (r) => r.resource.uri === "server-a:file:///home/user/doc1.txt",
    );
    expect(resource1?.server.url).toBe("https://server-a.example");

    const resource2 = capturedResources.find(
      (r) => r.resource.uri === "server-b:file:///workspace/code.js",
    );
    expect(resource2?.server.url).toBe("https://server-b.example");
  });

  it("should not prefix resources when only one server exists", async () => {
    const serverAResources = {
      resources: [
        {
          uri: "file:///home/user/doc.txt",
          name: "Document",
          mimeType: "text/plain",
        },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
      listResources: jest.fn().mockResolvedValue(serverAResources),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    createImpl.mockImplementation(async () => clientA);

    let capturedResources: ListResourceEntry[] = [];
    const Capture: React.FC = () => {
      const { data: resources } = useTamboMcpResourceList();
      useEffect(() => {
        if (resources) {
          capturedResources = resources;
        }
      }, [resources]);
      return null;
    };

    render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
            mcpServers={[
              {
                url: "https://server-a.example",
                transport: MCPTransport.SSE,
              },
            ]}
          >
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(capturedResources.length).toBe(1);
    });

    // No prefix when only 1 server
    expect(capturedResources[0].resource.uri).toBe("file:///home/user/doc.txt");
  });

  it("should remove resource prefixes when a server is removed", async () => {
    const serverAResources = {
      resources: [
        {
          uri: "file:///home/user/doc1.txt",
          name: "Document 1",
          mimeType: "text/plain",
        },
        {
          uri: "file:///home/user/doc2.txt",
          name: "Document 2",
          mimeType: "text/plain",
        },
      ],
    };
    const serverBResources = {
      resources: [
        {
          uri: "file:///workspace/code.js",
          name: "Code File",
          mimeType: "text/javascript",
        },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
      listResources: jest.fn().mockResolvedValue(serverAResources),
      close: jest.fn(),
    };
    const mockClientB = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
      listResources: jest.fn().mockResolvedValue(serverBResources),
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

    let capturedResources: ListResourceEntry[] = [];
    const Capture: React.FC = () => {
      const { data: resources } = useTamboMcpResourceList();
      useEffect(() => {
        if (resources) {
          capturedResources = resources;
        }
      }, [resources]);
      return null;
    };

    const { rerender } = render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
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
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for all resources to be loaded (prefixed)
    await waitFor(() => {
      expect(capturedResources.length).toBe(3);
    });

    const initialUris = capturedResources.map((r) => r.resource.uri);
    expect(initialUris).toContain("server-a:file:///home/user/doc1.txt");
    expect(initialUris).toContain("server-b:file:///workspace/code.js");

    // Now remove server B
    rerender(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
            mcpServers={[
              {
                url: "https://server-a.example",
                transport: MCPTransport.SSE,
              },
            ]}
          >
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for server B resources to be removed and prefixes stripped
    await waitFor(() => {
      expect(capturedResources.length).toBe(2);
    });

    const updatedUris = capturedResources.map((r) => r.resource.uri);
    expect(updatedUris).toContain("file:///home/user/doc1.txt"); // No prefix
    expect(updatedUris).toContain("file:///home/user/doc2.txt");
    expect(updatedUris).not.toContain("server-a:file:///home/user/doc1.txt"); // No prefix when only 1 server
    expect(updatedUris).not.toContain("server-b:file:///workspace/code.js"); // Server B removed
  });
});

describe("useTamboMcpResource - read individual resource", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    createImpl = jest.fn();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should read a resource from a single server (unprefixed)", async () => {
    const serverAResources = {
      resources: [
        {
          uri: "file:///home/user/doc.txt",
          name: "Document",
          mimeType: "text/plain",
        },
      ],
    };

    const resourceContents = {
      contents: [
        {
          uri: "file:///home/user/doc.txt",
          mimeType: "text/plain",
          text: "Hello, world!",
        },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
      listResources: jest.fn().mockResolvedValue(serverAResources),
      readResource: jest.fn().mockResolvedValue(resourceContents),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    createImpl.mockImplementation(async () => clientA);

    let capturedResourceData: any = null;
    const Capture: React.FC = () => {
      const { data: resourceData } = useTamboMcpResource(
        "file:///home/user/doc.txt",
      );
      useEffect(() => {
        if (resourceData) {
          capturedResourceData = resourceData;
        }
      }, [resourceData]);
      return null;
    };

    render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
            mcpServers={[
              {
                url: "https://server-a.example",
                transport: MCPTransport.SSE,
              },
            ]}
          >
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(capturedResourceData).not.toBeNull();
    });

    expect(capturedResourceData.contents[0].text).toBe("Hello, world!");
    expect(mockClientA.readResource).toHaveBeenCalledWith({
      uri: "file:///home/user/doc.txt",
    });
  });

  it("should read a resource from multiple servers (prefixed)", async () => {
    const serverAResources = {
      resources: [
        {
          uri: "file:///home/user/doc.txt",
          name: "Document",
          mimeType: "text/plain",
        },
      ],
    };
    const serverBResources = {
      resources: [
        {
          uri: "file:///workspace/code.js",
          name: "Code",
          mimeType: "text/javascript",
        },
      ],
    };

    const resourceContentsA = {
      contents: [
        {
          uri: "file:///home/user/doc.txt",
          mimeType: "text/plain",
          text: "From server A",
        },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
      listResources: jest.fn().mockResolvedValue(serverAResources),
      readResource: jest.fn().mockResolvedValue(resourceContentsA),
      close: jest.fn(),
    };

    const mockClientB = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue({ prompts: [] }),
      listResources: jest.fn().mockResolvedValue(serverBResources),
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

    let capturedResourceData: any = null;
    const Capture: React.FC = () => {
      // Request with prefix
      const { data: resourceData } = useTamboMcpResource(
        "server-a:file:///home/user/doc.txt",
      );
      useEffect(() => {
        if (resourceData) {
          capturedResourceData = resourceData;
        }
      }, [resourceData]);
      return null;
    };

    render(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
          mcpAccessToken: null,
          setMcpAccessToken: () => {},
        }}
      >
        <TamboMcpTokenProvider>
          <TamboRegistryProvider
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
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboRegistryProvider>
        </TamboMcpTokenProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(capturedResourceData).not.toBeNull();
    });

    expect(capturedResourceData.contents[0].text).toBe("From server A");
    // Verify the prefix was stripped before calling the server
    expect(mockClientA.readResource).toHaveBeenCalledWith({
      uri: "file:///home/user/doc.txt",
    });
  });
});
