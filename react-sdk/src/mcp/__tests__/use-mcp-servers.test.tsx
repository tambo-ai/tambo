import { render, waitFor } from "@testing-library/react";
import React, { useEffect } from "react";
import { TamboRegistryProvider } from "../../providers/tambo-registry-provider";
import {
  TamboMcpProvider,
  useTamboMcpServers,
  type McpServer,
} from "../tambo-mcp-provider";

// Mock the registry to provide a no-op registerTool
// Do not mock the registry; use the real provider in render

// Mock the MCP client; use a mutable implementation to avoid TDZ issues
let createImpl: jest.Mock<any, any> = jest.fn();
jest.mock("../mcp-client", () => ({
  MCPClient: { create: (...args: any[]) => createImpl(...args) },
  MCPTransport: { SSE: "sse", HTTP: "http" },
}));

// Import after mocks note: jest.mock calls are hoisted, so standard imports are fine

describe("useTamboMcpServers + TamboMcpProvider", () => {
  beforeEach(() => {
    createImpl = jest.fn();
  });

  it("provides normalized MCP server entries to inner components", async () => {
    const fakeClient = { listTools: jest.fn().mockResolvedValue([]) } as any;
    createImpl.mockResolvedValue(fakeClient);

    const Inner: React.FC = () => {
      const servers = useTamboMcpServers();
      return (
        <div>
          <div data-testid="count">{servers.length}</div>
          <div data-testid="urls">{servers.map((s) => s.url).join(",")}</div>
        </div>
      );
    };

    const { getByTestId } = render(
      <TamboRegistryProvider>
        <TamboMcpProvider
          mcpServers={[{ url: "https://one.example" }, "https://two.example"]}
        >
          <Inner />
        </TamboMcpProvider>
      </TamboRegistryProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("count").textContent).toBe("2");
      const urls = getByTestId("urls").textContent || "";
      expect(urls).toContain("https://one.example");
      expect(urls).toContain("https://two.example");
    });
  });

  it("marks a successfully connected server with a client instance", async () => {
    const fakeClient = { listTools: jest.fn().mockResolvedValue([]) } as any;
    createImpl.mockResolvedValue(fakeClient);

    let latest: McpServer[] = [];
    const Capture: React.FC = () => {
      const servers = useTamboMcpServers();
      useEffect(() => {
        latest = servers;
      }, [servers]);
      return null;
    };

    render(
      <TamboRegistryProvider>
        <TamboMcpProvider mcpServers={[{ url: "https://ok.example" }]}>
          <Capture />
        </TamboMcpProvider>
      </TamboRegistryProvider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
      expect("client" in latest[0]).toBe(true);
      expect((latest[0] as any).client).toBe(fakeClient);
      // no connectionError on connected server
      expect((latest[0] as any).connectionError).toBeUndefined();
    });
  });

  it("marks a failed server with a connectionError and no client", async () => {
    const boom = new Error("boom");
    createImpl.mockRejectedValue(boom);

    let latest: McpServer[] = [];
    const Capture: React.FC = () => {
      const servers = useTamboMcpServers();
      useEffect(() => {
        latest = servers;
      }, [servers]);
      return null;
    };

    render(
      <TamboRegistryProvider>
        <TamboMcpProvider mcpServers={[{ url: "https://fail.example" }]}>
          <Capture />
        </TamboMcpProvider>
      </TamboRegistryProvider>,
    );

    await waitFor(() => {
      expect(latest.length).toBe(1);
      expect("client" in latest[0]).toBe(false);
      // @ts-expect-error narrowing at runtime
      expect(latest[0].connectionError).toBeInstanceOf(Error);
      // @ts-expect-error narrowing at runtime
      expect(latest[0].connectionError?.message).toBe("boom");
    });
  });
});
