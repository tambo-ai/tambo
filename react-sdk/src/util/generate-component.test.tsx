import TamboAI from "@tambo-ai/typescript-sdk";
import React from "react";
import { ComponentRegistry } from "../model/component-metadata";
import * as useCurrentMessage from "../hooks/use-current-message";
import { renderComponentIntoMessage } from "./generate-component";

// Track calls to wrapWithTamboMessageProvider
let wrapWithTamboMessageProviderSpy: jest.SpyInstance;

beforeEach(() => {
  wrapWithTamboMessageProviderSpy = jest.spyOn(
    useCurrentMessage,
    "wrapWithTamboMessageProvider",
  );
});

afterEach(() => {
  wrapWithTamboMessageProviderSpy.mockRestore();
});

// Simple test component
const TestComponent: React.FC<{ title: string; count?: number }> = ({
  title,
  count,
}) => (
  <div data-testid="test-component">
    <span>{title}</span>
    {count !== undefined && <span>{count}</span>}
  </div>
);

// Create a mock Standard Schema for testing
const createMockStandardSchema = (validate: (data: unknown) => unknown) => ({
  "~standard": {
    version: 1,
    vendor: "test",
    validate: (data: unknown) => ({ value: validate(data) }),
  },
});

describe("renderComponentIntoMessage", () => {
  const baseMessage = {
    id: "msg-123",
    threadId: "thread-456",
    role: "assistant",
    content: [{ type: "text", text: "Here is your component" }],
    createdAt: "2024-01-01T00:00:00Z",
    componentState: {},
    component: {
      componentName: "TestComponent",
      props: { title: "Hello" },
      componentState: {},
      message: "",
    },
  } as unknown as TamboAI.Beta.Threads.ThreadMessage;

  const baseRegistry: ComponentRegistry = {
    TestComponent: {
      name: "TestComponent",
      description: "A test component",
      component: TestComponent,
      props: { type: "object" }, // JSON Schema
      contextTools: [],
    },
  };

  describe("component lookup", () => {
    it("throws error when component has no componentName", () => {
      const messageWithoutComponentName = {
        ...baseMessage,
        component: {
          componentName: "",
          props: {},
          componentState: {},
          message: "",
        },
      };

      expect(() =>
        renderComponentIntoMessage(messageWithoutComponentName, baseRegistry),
      ).toThrow("Component not found");
    });

    it("throws error when component is null", () => {
      const messageWithNullComponent = {
        ...baseMessage,
        component: null as any,
      };

      expect(() =>
        renderComponentIntoMessage(messageWithNullComponent, baseRegistry),
      ).toThrow();
    });

    it("throws error when componentName not in registry", () => {
      const messageWithUnknownComponent = {
        ...baseMessage,
        component: {
          componentName: "UnknownComponent",
          props: {},
          componentState: {},
          message: "",
        },
      };

      expect(() =>
        renderComponentIntoMessage(messageWithUnknownComponent, baseRegistry),
      ).toThrow(
        "Tambo tried to use Component UnknownComponent, but it was not found",
      );
    });

    it("successfully finds and renders registered component", () => {
      const result = renderComponentIntoMessage(baseMessage, baseRegistry);

      expect(result.component?.componentName).toBe("TestComponent");
      expect(result.renderedComponent).toBeDefined();
    });
  });

  describe("props handling", () => {
    it("passes props to component from message", () => {
      const messageWithProps = {
        ...baseMessage,
        component: {
          componentName: "TestComponent",
          props: { title: "Test Title", count: 42 },
          componentState: {},
          message: "",
        },
      };

      const result = renderComponentIntoMessage(messageWithProps, baseRegistry);

      expect(result.component?.props).toEqual({
        title: "Test Title",
        count: 42,
      });
    });

    it("handles empty props object", () => {
      const messageWithEmptyProps = {
        ...baseMessage,
        component: {
          componentName: "TestComponent",
          props: {},
          componentState: {},
          message: "",
        },
      };

      const result = renderComponentIntoMessage(
        messageWithEmptyProps,
        baseRegistry,
      );

      expect(result.component?.props).toEqual({});
    });

    it("handles nested object props", () => {
      const messageWithNestedProps = {
        ...baseMessage,
        component: {
          componentName: "TestComponent",
          props: {
            title: "Nested",
            config: { nested: { deeply: { value: 123 } } },
          },
          componentState: {},
          message: "",
        },
      };

      const result = renderComponentIntoMessage(
        messageWithNestedProps,
        baseRegistry,
      );

      expect(result.component?.props).toEqual({
        title: "Nested",
        config: { nested: { deeply: { value: 123 } } },
      });
    });

    it("handles array props", () => {
      const messageWithArrayProps = {
        ...baseMessage,
        component: {
          componentName: "TestComponent",
          props: { title: "Array Test", items: [1, 2, 3] },
          componentState: {},
          message: "",
        },
      };

      const result = renderComponentIntoMessage(
        messageWithArrayProps,
        baseRegistry,
      );

      expect(result.component?.props).toEqual({
        title: "Array Test",
        items: [1, 2, 3],
      });
    });
  });

  describe("Standard Schema validation", () => {
    it("validates props through Standard Schema when present", () => {
      const mockValidate = jest.fn((data) => ({
        ...data,
        validated: true,
      }));

      const registryWithStandardSchema: ComponentRegistry = {
        TestComponent: {
          name: "TestComponent",
          description: "A test component",
          component: TestComponent,
          props: createMockStandardSchema(mockValidate),
          contextTools: [],
        },
      };

      const result = renderComponentIntoMessage(
        baseMessage,
        registryWithStandardSchema,
      );

      expect(mockValidate).toHaveBeenCalled();
      // Standard Schema validate returns { value: T }, we extract the value
      expect(result.component?.props).toEqual({
        title: "Hello",
        validated: true,
      });
    });

    it("throws error when validation returns issues", () => {
      const registryWithFailingSchema: ComponentRegistry = {
        TestComponent: {
          name: "TestComponent",
          description: "A test component",
          component: TestComponent,
          props: {
            "~standard": {
              version: 1,
              vendor: "test",
              validate: () => ({
                issues: [{ message: "title is required", path: ["title"] }],
              }),
            },
          },
          contextTools: [],
        },
      };

      expect(() =>
        renderComponentIntoMessage(baseMessage, registryWithFailingSchema),
      ).toThrow("Component props validation failed: title is required");
    });

    it("throws error when validation returns async promise", () => {
      const registryWithAsyncSchema: ComponentRegistry = {
        TestComponent: {
          name: "TestComponent",
          description: "A test component",
          component: TestComponent,
          props: {
            "~standard": {
              version: 1,
              vendor: "test",
              validate: async () => await Promise.resolve({ value: {} }),
            },
          },
          contextTools: [],
        },
      };

      expect(() =>
        renderComponentIntoMessage(baseMessage, registryWithAsyncSchema),
      ).toThrow("Async schema validation is not supported for component props");
    });

    it("uses raw props when props is JSON Schema (not Standard Schema)", () => {
      const jsonSchemaRegistry: ComponentRegistry = {
        TestComponent: {
          name: "TestComponent",
          description: "A test component",
          component: TestComponent,
          props: {
            type: "object",
            properties: {
              title: { type: "string" },
            },
          },
          contextTools: [],
        },
      };

      const result = renderComponentIntoMessage(
        baseMessage,
        jsonSchemaRegistry,
      );

      // Should pass through without validation
      expect(result.component?.props).toEqual({ title: "Hello" });
    });
  });

  describe("message structure", () => {
    it("preserves original message properties", () => {
      const result = renderComponentIntoMessage(baseMessage, baseRegistry);

      expect(result.id).toBe("msg-123");
      expect(result.threadId).toBe("thread-456");
      expect(result.role).toBe("assistant");
      expect(result.content).toEqual([
        { type: "text", text: "Here is your component" },
      ]);
      expect(result.createdAt).toBe("2024-01-01T00:00:00Z");
    });

    it("includes renderedComponent in result", () => {
      const result = renderComponentIntoMessage(baseMessage, baseRegistry);

      expect(result.renderedComponent).toBeDefined();
      expect(React.isValidElement(result.renderedComponent)).toBe(true);
    });

    it("wraps component with TamboMessageProvider", () => {
      renderComponentIntoMessage(baseMessage, baseRegistry);

      expect(wrapWithTamboMessageProviderSpy).toHaveBeenCalled();
      // Check that the message passed to the wrapper has the correct structure
      const callArgs = wrapWithTamboMessageProviderSpy.mock.calls[0];
      expect(callArgs[1].id).toBe("msg-123");
    });
  });

  describe("edge cases", () => {
    it("handles special characters in props", () => {
      const messageWithSpecialChars = {
        ...baseMessage,
        component: {
          componentName: "TestComponent",
          props: { title: "Hello <script>alert('xss')</script>" },
          componentState: {},
          message: "",
        },
      };

      const result = renderComponentIntoMessage(
        messageWithSpecialChars,
        baseRegistry,
      );

      expect(result.component?.props.title).toBe(
        "Hello <script>alert('xss')</script>",
      );
    });

    it("handles unicode in props", () => {
      const messageWithUnicode = {
        ...baseMessage,
        component: {
          componentName: "TestComponent",
          props: { title: "Hello \u4e16\u754c" }, // "Hello 世界"
          componentState: {},
          message: "",
        },
      };

      const result = renderComponentIntoMessage(
        messageWithUnicode,
        baseRegistry,
      );

      expect(result.component?.props.title).toBe("Hello \u4e16\u754c");
    });

    it("handles null values in props", () => {
      const messageWithNullProp = {
        ...baseMessage,
        component: {
          componentName: "TestComponent",
          props: { title: "Test", nullValue: null },
          componentState: {},
          message: "",
        },
      };

      const result = renderComponentIntoMessage(
        messageWithNullProp,
        baseRegistry,
      );

      expect(result.component?.props).toEqual({
        title: "Test",
        nullValue: null,
      });
    });
  });
});
