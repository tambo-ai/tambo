import { act, renderHook } from "@testing-library/react";
import React from "react";
import { z } from "zod/v4";
import { TamboComponent, TamboTool } from "../model/component-metadata";
import { defineTool } from "../util/registry";
import {
  TamboRegistryProvider,
  useTamboRegistry,
} from "./tambo-registry-provider";

// Shared tool registry for all tests
const createMockTools = (): TamboTool[] => [
  defineTool({
    name: "test-tool-1",
    description: "First test tool",
    tool: jest.fn().mockResolvedValue("test-tool-1-result"),
    inputSchema: z.object({
      input: z.string().describe("input parameter"),
    }),
    outputSchema: z.string(),
  }),
  defineTool({
    name: "test-tool-2",
    description: "Second test tool",
    tool: jest.fn().mockResolvedValue("test-tool-2-result"),
    inputSchema: z.object({
      value: z.number().describe("number parameter"),
    }),
    outputSchema: z.string(),
  }),
];

const createMockComponents = (tools: TamboTool[]): TamboComponent[] => [
  {
    name: "TestComponent",
    component: () => <div>TestComponent</div>,
    description: "Test component",
    propsSchema: z.object({
      test: z.string(),
    }),
    associatedTools: tools,
  },
];

describe("TamboRegistryProvider", () => {
  const mockTools = createMockTools();
  const mockComponents = createMockComponents(mockTools);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component and tool registration", () => {
    it("should register components and tools correctly", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider components={mockComponents}>
          {children}
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(result.current.componentList).toHaveProperty("TestComponent");
      expect(result.current.toolRegistry).toHaveProperty("test-tool-1");
      expect(result.current.toolRegistry).toHaveProperty("test-tool-2");
      expect(result.current.componentToolAssociations).toHaveProperty(
        "TestComponent",
      );
      expect(result.current.componentToolAssociations.TestComponent).toEqual([
        "test-tool-1",
        "test-tool-2",
      ]);
    });

    it("should provide onCallUnregisteredTool in context", () => {
      const mockonCallUnregisteredTool = jest
        .fn()
        .mockResolvedValue("test-result");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider
          components={mockComponents}
          onCallUnregisteredTool={mockonCallUnregisteredTool}
        >
          {children}
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // The onCallUnregisteredTool should be available in the context
      expect(result.current.onCallUnregisteredTool).toBeDefined();
      expect(typeof result.current.onCallUnregisteredTool).toBe("function");
    });

    it("should handle tool registration and association", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // Register a new tool
      act(() => {
        result.current.registerTool(mockTools[0]);
      });

      expect(result.current.toolRegistry).toHaveProperty("test-tool-1");

      // Register a new component
      act(() => {
        result.current.registerComponent(mockComponents[0]);
      });

      expect(result.current.componentList).toHaveProperty("TestComponent");
      expect(result.current.componentToolAssociations).toHaveProperty(
        "TestComponent",
      );
    });

    it("should handle multiple tool registration", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // Register multiple tools
      act(() => {
        result.current.registerTools(mockTools);
      });

      expect(result.current.toolRegistry).toHaveProperty("test-tool-1");
      expect(result.current.toolRegistry).toHaveProperty("test-tool-2");
      expect(Object.keys(result.current.toolRegistry)).toHaveLength(2);
    });
    it("should preserve maxCalls when registering a tool", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const maxTool: TamboTool = {
        name: "max-tool",
        description: "Tool with maxCalls",
        tool: jest.fn().mockResolvedValue("ok"),
        inputSchema: z.object({}),
        outputSchema: z.object(),
        maxCalls: 4,
      };

      act(() => {
        result.current.registerTool(maxTool);
      });

      expect(result.current.toolRegistry["max-tool"].maxCalls).toBe(4);
    });

    it("should warn when overwriting an existing tool by default", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Register a tool
      act(() => {
        result.current.registerTool(mockTools[0]);
      });

      // Register the same tool again (should warn by default)
      act(() => {
        result.current.registerTool(mockTools[0]);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Overwriting tool test-tool-1"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should not warn when overwriting a tool if warnOnOverwrite is false", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Register a tool
      act(() => {
        result.current.registerTool(mockTools[0], false);
      });

      // Register the same tool again with warnOnOverwrite=false
      act(() => {
        result.current.registerTool(mockTools[0], false);
      });

      // Should not warn about "Registering new tool"
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Overwriting tool test-tool-1"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle tool association with components", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider components={mockComponents}>
          {children}
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // Add a new tool association
      const newTool: TamboTool = {
        name: "new-tool",
        description: "New tool",
        tool: jest.fn().mockResolvedValue("new-tool-result"),
        inputSchema: z.object({
          input: z.string().describe("input"),
        }),
        outputSchema: z.string(),
      };

      // First register the tool
      act(() => {
        result.current.registerTool(newTool);
      });

      // Then add the association
      act(() => {
        result.current.addToolAssociation("TestComponent", newTool);
      });

      expect(result.current.componentToolAssociations.TestComponent).toContain(
        "new-tool",
      );
    });

    it("should throw error when adding tool association to non-existent component", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const newTool: TamboTool = {
        name: "new-tool",
        description: "New tool",
        tool: jest.fn().mockResolvedValue("new-tool-result"),
        inputSchema: z.object({
          input: z.string().describe("input"),
        }),
        outputSchema: z.string(),
      };

      expect(() => {
        act(() => {
          result.current.addToolAssociation("NonExistentComponent", newTool);
        });
      }).toThrow("Component NonExistentComponent not found in registry");
    });

    it("should validate tool schemas and throw error for invalid schemas", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const invalidTool: TamboTool = {
        name: "invalid-tool",
        description: "Invalid tool",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: z.record(z.string(), z.string()), // This should cause validation to fail
        outputSchema: z.string(),
      };

      // This should throw during registration due to invalid schema
      expect(() => {
        act(() => {
          result.current.registerTool(invalidTool);
        });
      }).toThrow(
        'Record types (objects with dynamic keys) are not supported in inputSchema of tool "invalid-tool". Found at path "(root)". Replace it with an object using explicit keys.',
      );
    });

    it("should validate component schemas and throw error for invalid schemas", () => {
      const invalidComponent: TamboComponent = {
        name: "InvalidComponent",
        component: () => <div>Invalid</div>,
        description: "Invalid component",
        propsSchema: z.record(z.string(), z.string()), // This should cause validation to fail
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // This should throw during registration due to invalid schema
      expect(() => {
        act(() => {
          result.current.registerComponent(invalidComponent);
        });
      }).toThrow(
        'Record types (objects with dynamic keys) are not supported in propsSchema of component "InvalidComponent"',
      );
    });

    it("should throw error when component has both propsSchema and propsDefinition", () => {
      const invalidComponent: TamboComponent = {
        name: "InvalidComponent",
        component: () => <div>Invalid</div>,
        description: "Invalid component",
        propsSchema: z.object({ test: z.string() }),
        propsDefinition: { test: "string" }, // Both defined - should throw
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(() => {
        act(() => {
          result.current.registerComponent(invalidComponent);
        });
      }).toThrow(
        "Component InvalidComponent cannot have both propsSchema and propsDefinition defined",
      );
    });

    it("should throw error when component has neither propsSchema nor propsDefinition", () => {
      const invalidComponent: TamboComponent = {
        name: "InvalidComponent",
        component: () => <div>Invalid</div>,
        description: "Invalid component",
        // Neither propsSchema nor propsDefinition defined - should throw
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(() => {
        act(() => {
          result.current.registerComponent(invalidComponent);
        });
      }).toThrow(
        "Component InvalidComponent must have either propsSchema (recommended) or propsDefinition defined",
      );
    });

    it("should throw error when tool name contains spaces", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const invalidTool: TamboTool = {
        name: "invalid tool name", // Contains spaces
        description: "Tool with spaces in name",
        tool: jest.fn().mockResolvedValue("result"),
        inputSchema: z.object({
          input: z.string(),
        }),
        outputSchema: z.string(),
      };

      expect(() => {
        act(() => {
          result.current.registerTool(invalidTool);
        });
      }).toThrow(
        'tool "invalid tool name" must only contain letters, numbers, underscores, and hyphens.',
      );
    });

    it("should throw error when component name contains spaces", () => {
      const invalidComponent: TamboComponent = {
        name: "Invalid Component Name", // Contains spaces
        component: () => <div>Invalid</div>,
        description: "Component with spaces in name",
        propsSchema: z.object({ test: z.string() }),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(() => {
        act(() => {
          result.current.registerComponent(invalidComponent);
        });
      }).toThrow(
        'component "Invalid Component Name" must only contain letters, numbers, underscores, and hyphens.',
      );
    });
  });

  describe("Tool call handling", () => {
    it("should provide onCallUnregisteredTool callback for handling unknown tools", async () => {
      const mockonCallUnregisteredTool = jest
        .fn()
        .mockResolvedValue("unknown-tool-result");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider
          components={mockComponents}
          onCallUnregisteredTool={mockonCallUnregisteredTool}
        >
          {children}
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // Verify the callback is available
      expect(result.current.onCallUnregisteredTool).toBeDefined();
      expect(typeof result.current.onCallUnregisteredTool).toBe("function");

      // Simulate calling the unknown tool handler
      const toolName = "unknown-tool";
      const args = [{ parameterName: "input", parameterValue: "test-input" }];

      await act(async () => {
        if (result.current.onCallUnregisteredTool) {
          await result.current.onCallUnregisteredTool(toolName, args);
        }
      });

      expect(mockonCallUnregisteredTool).toHaveBeenCalledWith(toolName, args);
    });

    it("should handle onCallUnregisteredTool being undefined", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider components={mockComponents}>
          {children}
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(result.current.onCallUnregisteredTool).toBeUndefined();
    });
  });

  describe("Resource registration", () => {
    it("should register static resources via props", () => {
      const staticResources = [
        {
          uri: "file:///local/doc.txt",
          name: "Local Document",
          mimeType: "text/plain",
        },
        {
          uri: "file:///local/image.png",
          name: "Local Image",
          mimeType: "image/png",
        },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider resources={staticResources}>
          {children}
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(result.current.resources).toHaveLength(2);
      expect(result.current.resources[0].uri).toBe("file:///local/doc.txt");
      expect(result.current.resources[1].uri).toBe("file:///local/image.png");
    });

    it("should register resources dynamically via registerResource", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const newResource = {
        uri: "file:///dynamic/doc.txt",
        name: "Dynamic Document",
        mimeType: "text/plain",
      };

      act(() => {
        result.current.registerResource(newResource);
      });

      expect(result.current.resources).toHaveLength(1);
      expect(result.current.resources[0].uri).toBe("file:///dynamic/doc.txt");
    });

    it("should register multiple resources via registerResources", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const newResources = [
        {
          uri: "file:///batch/doc1.txt",
          name: "Batch Document 1",
          mimeType: "text/plain",
        },
        {
          uri: "file:///batch/doc2.txt",
          name: "Batch Document 2",
          mimeType: "text/plain",
        },
      ];

      act(() => {
        result.current.registerResources(newResources);
      });

      expect(result.current.resources).toHaveLength(2);
      expect(result.current.resources[0].uri).toBe("file:///batch/doc1.txt");
      expect(result.current.resources[1].uri).toBe("file:///batch/doc2.txt");
    });

    it("should register resource source via props", () => {
      const mockListResources = jest.fn().mockResolvedValue([]);
      const mockGetResource = jest.fn().mockResolvedValue({
        contents: [{ uri: "", mimeType: "text/plain", text: "" }],
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider
          listResources={mockListResources}
          getResource={mockGetResource}
        >
          {children}
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      expect(result.current.resourceSource).not.toBeNull();
      expect(result.current.resourceSource?.listResources).toBe(
        mockListResources,
      );
      expect(result.current.resourceSource?.getResource).toBe(mockGetResource);
    });

    it("should register resource source via registerResourceSource", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const mockListResources = jest.fn().mockResolvedValue([]);
      const mockGetResource = jest.fn().mockResolvedValue({
        contents: [{ uri: "", mimeType: "text/plain", text: "" }],
      });

      act(() => {
        result.current.registerResourceSource({
          listResources: mockListResources,
          getResource: mockGetResource,
        });
      });

      expect(result.current.resourceSource).not.toBeNull();
      expect(result.current.resourceSource?.listResources).toBe(
        mockListResources,
      );
      expect(result.current.resourceSource?.getResource).toBe(mockGetResource);
    });

    it("should throw error when only listResources is provided", () => {
      const mockListResources = jest.fn().mockResolvedValue([]);

      expect(() => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <TamboRegistryProvider listResources={mockListResources}>
            {children}
          </TamboRegistryProvider>
        );
        renderHook(() => useTamboRegistry(), { wrapper });
      }).toThrow(
        "Both listResources and getResource must be provided together",
      );
    });

    it("should throw error when only getResource is provided", () => {
      const mockGetResource = jest.fn().mockResolvedValue({
        contents: [{ uri: "", mimeType: "text/plain", text: "" }],
      });

      expect(() => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <TamboRegistryProvider getResource={mockGetResource}>
            {children}
          </TamboRegistryProvider>
        );
        renderHook(() => useTamboRegistry(), { wrapper });
      }).toThrow(
        "Both listResources and getResource must be provided together",
      );
    });

    it("should validate resource has required uri field", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const invalidResource = {
        name: "Document without URI",
        mimeType: "text/plain",
      } as any;

      expect(() => {
        act(() => {
          result.current.registerResource(invalidResource);
        });
      }).toThrow("Resource must have a 'uri' field");
    });

    it("should validate resource has required name field", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider>{children}</TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      const invalidResource = {
        uri: "file:///doc.txt",
        mimeType: "text/plain",
      } as any;

      expect(() => {
        act(() => {
          result.current.registerResource(invalidResource);
        });
      }).toThrow(
        "Resource with URI 'file:///doc.txt' must have a 'name' field",
      );
    });
  });
});
