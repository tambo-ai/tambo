import { render, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { TamboClientContext } from "../providers/tambo-client-provider";
import { TamboMcpTokenProvider } from "../providers/tambo-mcp-token-provider";
import { TamboRegistryProvider } from "../providers/tambo-registry-provider";
import { MCPTransport } from "./mcp-client";
import { TamboMcpProvider, useTamboMcpServers } from "./tambo-mcp-provider";
import {
  useTamboMcpPromptList,
  useTamboMcpResourceList,
  useTamboMcpResource,
  isMcpResourceEntry,
  type ListPromptEntry,
  type ListResourceEntry,
} from "./mcp-hooks";

// Mock the MCP client to avoid ES module issues
let createImpl: jest.Mock = jest.fn();
jest.mock("./mcp-client", () => ({
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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
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
        }}
      >
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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
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
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for prompts to be updated (server B prompts should disappear)
    // Prompts are now always prefixed (breaking change)
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(2);
    });

    const updatedPromptNames = capturedPrompts.map((p) => p.prompt.name);
    expect(updatedPromptNames).toContain("server-a:prompt-a1");
    expect(updatedPromptNames).toContain("server-a:prompt-a2");
    expect(updatedPromptNames).not.toContain("prompt-b1");
    expect(updatedPromptNames).not.toContain("prompt-b2");
    expect(updatedPromptNames).not.toContain("prompt-a1"); // Always prefixed now

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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
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
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for initial prompts from server A (always prefixed)
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(1);
    });

    expect(capturedPrompts.map((p) => p.prompt.name)).toContain(
      "server-a:prompt-a",
    );

    // Add server B
    rerender(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
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

describe("useTamboMcpPromptList - search filtering", () => {
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

  it("should filter MCP prompts locally by search string", async () => {
    const serverAPrompts = {
      prompts: [
        { name: "create-issue", description: "Create a new issue" },
        { name: "list-tasks", description: "List all tasks" },
        { name: "search-docs", description: "Search documentation" },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverAPrompts),
      listResources: jest.fn().mockResolvedValue({ resources: [] }),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    createImpl.mockImplementation(async () => clientA);

    let capturedPrompts: ListPromptEntry[] = [];
    const Capture: React.FC<{ search?: string }> = ({ search }) => {
      const { data: prompts } = useTamboMcpPromptList(search);
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
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for all prompts to be loaded (no search)
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(3);
    });

    // Now search for "issue"
    rerender(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture search="issue" />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Should only have the create-issue prompt
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(1);
    });

    expect(capturedPrompts[0].prompt.name).toBe("server-a:create-issue");

    // MCP listPrompts should only be called once (not re-fetched on search change)
    expect(mockClientA.listPrompts).toHaveBeenCalledTimes(1);
  });

  it("should filter prompts case-insensitively", async () => {
    const serverAPrompts = {
      prompts: [
        { name: "Create-Issue", description: "Create a new issue" },
        { name: "list-tasks", description: "List all tasks" },
      ],
    };

    const mockClientA = {
      listTools: jest.fn().mockResolvedValue([]),
      listPrompts: jest.fn().mockResolvedValue(serverAPrompts),
      listResources: jest.fn().mockResolvedValue({ resources: [] }),
      close: jest.fn(),
    };

    const clientA = {
      client: mockClientA,
      listTools: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
    };

    createImpl.mockImplementation(async () => clientA);

    let capturedPrompts: ListPromptEntry[] = [];
    const Capture: React.FC<{ search?: string }> = ({ search }) => {
      const { data: prompts } = useTamboMcpPromptList(search);
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
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture search="CREATE" />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Should find "Create-Issue" even though search is uppercase
    await waitFor(() => {
      expect(capturedPrompts.length).toBe(1);
    });

    expect(capturedPrompts[0].prompt.name).toBe("server-a:Create-Issue");
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

  it("should identify MCP-backed entries with isMcpResourceEntry", () => {
    const registryEntry: ListResourceEntry = {
      server: null,
      // Resource shape is not important for this helper, so cast to keep the
      // test focused on the discriminant field.
      resource: {
        uri: "file:///registry/doc.txt",
        name: "Registry Doc",
        mimeType: "text/plain",
      } as any,
    };

    const mcpEntry: ListResourceEntry = {
      server: { key: "server-a", client: {} } as any,
      resource: {
        uri: "server-a:file:///home/user/doc.txt",
        name: "Document",
        mimeType: "text/plain",
      } as any,
    };

    expect(isMcpResourceEntry(mcpEntry)).toBe(true);
    expect(isMcpResourceEntry(registryEntry)).toBe(false);
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
        }}
      >
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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
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
    expect(resource1).toBeDefined();
    expect(resource1!.server).not.toBeNull();
    expect(resource1!.server!.url).toBe("https://server-a.example");

    const resource2 = capturedResources.find(
      (r) => r.resource.uri === "server-b:file:///workspace/code.js",
    );
    expect(resource2).toBeDefined();
    expect(resource2!.server).not.toBeNull();
    expect(resource2!.server!.url).toBe("https://server-b.example");
  });

  it("should always prefix MCP resources even with single server", async () => {
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
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(capturedResources.length).toBe(1);
    });

    // Always prefix MCP resources, even with 1 server (breaking change)
    expect(capturedResources[0].resource.uri).toBe(
      "server-a:file:///home/user/doc.txt",
    );
  });

  it("should maintain prefixes even when servers are removed", async () => {
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
        }}
      >
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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
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
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for server B resources to be removed (prefixes maintained)
    await waitFor(() => {
      expect(capturedResources.length).toBe(2);
    });

    const updatedUris = capturedResources.map((r) => r.resource.uri);
    // Prefixes are maintained even with only 1 server (breaking change)
    expect(updatedUris).toContain("server-a:file:///home/user/doc1.txt");
    expect(updatedUris).toContain("server-a:file:///home/user/doc2.txt");
    expect(updatedUris).not.toContain("file:///home/user/doc1.txt"); // Always prefixed now
    expect(updatedUris).not.toContain("server-b:file:///workspace/code.js"); // Server B removed
  });
});

describe("useTamboMcpResourceList - search filtering", () => {
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

  it("should filter MCP resources locally by search string", async () => {
    const serverAResources = {
      resources: [
        {
          uri: "file:///home/user/document.txt",
          name: "My Document",
          mimeType: "text/plain",
        },
        {
          uri: "file:///home/user/image.png",
          name: "My Image",
          mimeType: "image/png",
        },
        {
          uri: "file:///home/user/notes.txt",
          name: "Notes",
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
    const Capture: React.FC<{ search?: string }> = ({ search }) => {
      const { data: resources } = useTamboMcpResourceList(search);
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
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for all resources to be loaded (no search)
    await waitFor(() => {
      expect(capturedResources.length).toBe(3);
    });

    // Now search for "document"
    rerender(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture search="document" />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Should only have the document resource
    await waitFor(() => {
      expect(capturedResources.length).toBe(1);
    });

    expect(capturedResources[0].resource.name).toBe("My Document");

    // MCP listResources should only be called once (not re-fetched on search change)
    expect(mockClientA.listResources).toHaveBeenCalledTimes(1);
  });

  it("should pass search string to registry listResources for dynamic generation", async () => {
    const listResources = jest
      .fn()
      .mockImplementation(async (search?: string) => {
        // Dynamically generate resources based on search
        if (!search) return [];
        return [
          {
            uri: `dynamic://${search}`,
            name: `Dynamic Resource for ${search}`,
            mimeType: "text/plain",
          },
        ];
      });
    const getResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "test", text: "test content", mimeType: "text/plain" }],
    });

    let capturedResources: ListResourceEntry[] = [];
    const Capture: React.FC<{ search?: string }> = ({ search }) => {
      const { data: resources } = useTamboMcpResourceList(search);
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
        }}
      >
        <TamboRegistryProvider
          listResources={listResources}
          getResource={getResource}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture search="foo" />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for dynamic resource to be generated
    await waitFor(() => {
      expect(capturedResources.length).toBe(1);
    });

    // Verify listResources was called with the search string
    expect(listResources).toHaveBeenCalledWith("foo");
    expect(capturedResources[0].resource.name).toBe("Dynamic Resource for foo");
    // Registry resources get the "registry:" prefix
    expect(capturedResources[0].resource.uri).toBe("registry:dynamic://foo");

    // Now search for "bar"
    rerender(
      <TamboClientContext.Provider
        value={{
          client: { baseURL: "https://api.tambo.co" } as any,
          queryClient,
          isUpdatingToken: false,
        }}
      >
        <TamboRegistryProvider
          listResources={listResources}
          getResource={getResource}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture search="bar" />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for new dynamic resource
    await waitFor(() => {
      expect(capturedResources[0].resource.uri).toBe("registry:dynamic://bar");
    });

    // listResources should be called again with new search
    expect(listResources).toHaveBeenCalledWith("bar");
    expect(capturedResources[0].resource.name).toBe("Dynamic Resource for bar");
  });

  it("should not locally substring-filter dynamic registry resources", async () => {
    const listResources = jest
      .fn()
      .mockImplementation(async (search?: string) => {
        if (!search) return [];
        // Simulate a provider that matches resources using non-substring logic.
        return [
          {
            uri: "dynamic://matched-by-provider",
            name: "Smart Match",
            mimeType: "text/plain",
          },
        ];
      });
    const getResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "test", text: "test content", mimeType: "text/plain" }],
    });

    let capturedResources: ListResourceEntry[] = [];
    const Capture: React.FC<{ search?: string }> = ({ search }) => {
      const { data: resources } = useTamboMcpResourceList(search);
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
        }}
      >
        <TamboRegistryProvider
          listResources={listResources}
          getResource={getResource}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture search="foo" />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(capturedResources.length).toBe(1);
    });

    expect(listResources).toHaveBeenCalledWith("foo");
    expect(capturedResources[0].server).toBeNull();
    expect(capturedResources[0].resource.name).toBe("Smart Match");
    expect(capturedResources[0].resource.uri).toBe(
      "registry:dynamic://matched-by-provider",
    );
  });

  it("should combine MCP filtered resources with dynamically generated registry resources", async () => {
    const serverAResources = {
      resources: [
        {
          uri: "file:///apple.txt",
          name: "Apple",
          mimeType: "text/plain",
        },
        {
          uri: "file:///banana.txt",
          name: "Banana",
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

    const listResources = jest
      .fn()
      .mockImplementation(async (search?: string) => {
        // Always return a resource that includes the search term
        return [
          {
            uri: `registry://${search ?? "all"}`,
            name: `Registry ${search ?? "all"}`,
            mimeType: "text/plain",
          },
        ];
      });
    const getResource = jest.fn().mockResolvedValue({
      contents: [{ uri: "test", text: "test", mimeType: "text/plain" }],
    });

    let capturedResources: ListResourceEntry[] = [];
    const Capture: React.FC<{ search?: string }> = ({ search }) => {
      const { data: resources } = useTamboMcpResourceList(search);
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
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
          listResources={listResources}
          getResource={getResource}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture search="apple" />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    // Wait for resources
    await waitFor(() => {
      // Should have: 1 MCP resource (Apple filtered) + 1 registry resource (dynamic)
      expect(capturedResources.length).toBe(2);
    });

    const uris = capturedResources.map((r) => r.resource.uri);
    // MCP "Apple" should match (filtered locally)
    expect(uris).toContain("server-a:file:///apple.txt");
    // Registry dynamic resource
    expect(uris).toContain("registry:registry://apple");
    // MCP "Banana" should NOT be included (filtered out)
    expect(uris).not.toContain("server-a:file:///banana.txt");
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

  it("should read a resource from a single server (prefixed)", async () => {
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
      // MCP resources are always prefixed, even with single server
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
        }}
      >
        <TamboRegistryProvider
          mcpServers={[
            {
              url: "https://server-a.example",
              transport: MCPTransport.SSE,
            },
          ]}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
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
        }}
      >
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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
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

  it("should read registry resources via resourceSource with registry prefix", async () => {
    const originalUri = "file:///local/registry-doc.txt";
    const prefixedUri = `registry:${originalUri}`;

    const listResources = jest.fn().mockResolvedValue([]);
    const getResource = jest.fn().mockResolvedValue({
      contents: [
        {
          uri: originalUri,
          mimeType: "text/plain",
          text: "Registry content",
        },
      ],
    });

    let capturedResourceData: any = null;
    const Capture: React.FC = () => {
      // Request with registry: prefix
      const { data: resourceData } = useTamboMcpResource(prefixedUri);
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
        }}
      >
        <TamboRegistryProvider
          listResources={listResources}
          getResource={getResource}
        >
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <Capture />
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboRegistryProvider>
      </TamboClientContext.Provider>,
    );

    await waitFor(() => {
      expect(capturedResourceData).not.toBeNull();
    });

    // getResource should be called with the original URI (prefix stripped)
    expect(getResource).toHaveBeenCalledWith(originalUri);
    expect(capturedResourceData.contents[0].text).toBe("Registry content");
  });
});
