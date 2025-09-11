import { act, renderHook } from "@testing-library/react";
import React from "react";
import { z } from "zod";
import { TamboComponent, TamboTool } from "../../model/component-metadata";
import {
  TamboRegistryProvider,
  useTamboRegistry,
} from "../tambo-registry-provider";

// Shared tool registry for all tests
const createMockTools = (): TamboTool[] => [
  {
    name: "test-tool-1",
    description: "First test tool",
    tool: jest.fn().mockResolvedValue("test-tool-1-result"),
    toolSchema: z
      .function()
      .args(z.string().describe("input parameter"))
      .returns(z.string()),
  },
  {
    name: "test-tool-2",
    description: "Second test tool",
    tool: jest.fn().mockResolvedValue("test-tool-2-result"),
    toolSchema: z
      .function()
      .args(z.number().describe("number parameter"))
      .returns(z.string()),
  },
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

    it("should handle tool association with components", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TamboRegistryProvider components={mockComponents}>
          {children}
        </TamboRegistryProvider>
      );

      const { result } = renderHook(() => useTamboRegistry(), { wrapper });

      // Add a new tool association
      act(() => {
        const newTool: TamboTool = {
          name: "new-tool",
          description: "New tool",
          tool: jest.fn().mockResolvedValue("new-tool-result"),
          toolSchema: z
            .function()
            .args(z.string().describe("input"))
            .returns(z.string()),
        };
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
        toolSchema: z
          .function()
          .args(z.string().describe("input"))
          .returns(z.string()),
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
        toolSchema: z.record(z.string()), // This should cause validation to fail
      };

      // This should throw during registration due to invalid schema
      expect(() => {
        act(() => {
          result.current.registerTool(invalidTool);
        });
      }).toThrow(
        'z.record() is not supported in toolSchema of tool "invalid-tool"',
      );
    });

    it("should validate component schemas and throw error for invalid schemas", () => {
      const invalidComponent: TamboComponent = {
        name: "InvalidComponent",
        component: () => <div>Invalid</div>,
        description: "Invalid component",
        propsSchema: z.record(z.string()), // This should cause validation to fail
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
        'z.record() is not supported in propsSchema of component "InvalidComponent"',
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
});
