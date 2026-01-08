import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ClientNotification,
  ClientRequest,
  ElicitRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { act, renderHook } from "@testing-library/react";
import {
  useElicitation,
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "./elicitation";

// Create a mock RequestHandlerExtra for testing
function createMockExtra(): RequestHandlerExtra<
  ClientRequest,
  ClientNotification
> {
  return {
    signal: new AbortController().signal,
    requestId: "test-request-id",

    sendNotification: (async () => {}) as any,

    sendRequest: (async () => ({ _meta: {} })) as any,
  };
}

describe("useElicitation", () => {
  it("initializes with null state", () => {
    const { result } = renderHook(() => useElicitation());

    expect(result.current.elicitation).toBeNull();
    expect(result.current.resolveElicitation).toBeNull();
  });

  it("provides state setters", () => {
    const { result } = renderHook(() => useElicitation());

    expect(typeof result.current.setElicitation).toBe("function");
    expect(typeof result.current.setResolveElicitation).toBe("function");
  });

  it("provides a default elicitation handler", () => {
    const { result } = renderHook(() => useElicitation());

    expect(typeof result.current.defaultElicitationHandler).toBe("function");
  });

  describe("defaultElicitationHandler", () => {
    it("sets elicitation state when called", async () => {
      const { result } = renderHook(() => useElicitation());

      const request: ElicitRequest = {
        method: "elicitation/create",
        params: {
          message: "Please provide your name",
          requestedSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Your name" },
            },
            required: ["name"],
          },
        },
      };

      // Start the handler but don't await yet
      let handlerPromise: Promise<TamboElicitationResponse>;
      const extra = createMockExtra();
      act(() => {
        handlerPromise = result.current.defaultElicitationHandler(
          request,
          extra,
        );
      });

      // Elicitation should be set
      const requestedSchema =
        "requestedSchema" in request.params
          ? request.params.requestedSchema
          : null;

      expect(requestedSchema).not.toBeNull();

      if (requestedSchema === null) {
        return;
      }

      expect(result.current.elicitation).toEqual({
        message: "Please provide your name",
        requestedSchema,
        signal: extra.signal,
      });

      // Resolve callback should be set
      expect(result.current.resolveElicitation).not.toBeNull();

      // Clean up by resolving
      act(() => {
        result.current.resolveElicitation?.({
          action: "cancel",
        });
      });

      await handlerPromise!;
    });

    it("resolves promise when resolveElicitation is called with accept", async () => {
      const { result } = renderHook(() => useElicitation());

      const request: ElicitRequest = {
        method: "elicitation/create",
        params: {
          message: "Enter your email",
          requestedSchema: {
            type: "object",
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "Email address",
              },
            },
          },
        },
      };

      // Start the handler
      let handlerPromise: Promise<TamboElicitationResponse>;
      const extra = createMockExtra();
      act(() => {
        handlerPromise = result.current.defaultElicitationHandler(
          request,
          extra,
        );
      });

      // Resolve with accept
      const response: TamboElicitationResponse = {
        action: "accept",
        content: { email: "test@example.com" },
      };

      act(() => {
        result.current.resolveElicitation?.(response);
      });

      // Wait for promise to resolve
      const resolvedValue = await handlerPromise!;

      expect(resolvedValue).toEqual(response);
    });

    it("resolves promise when resolveElicitation is called with decline", async () => {
      const { result } = renderHook(() => useElicitation());

      const request: ElicitRequest = {
        method: "elicitation/create",
        params: {
          message: "Provide input",
          requestedSchema: {
            type: "object",
            properties: {
              value: { type: "string" },
            },
          },
        },
      };

      let handlerPromise: Promise<TamboElicitationResponse>;
      const extra = createMockExtra();
      act(() => {
        handlerPromise = result.current.defaultElicitationHandler(
          request,
          extra,
        );
      });

      const response: TamboElicitationResponse = {
        action: "decline",
      };

      act(() => {
        result.current.resolveElicitation?.(response);
      });

      const resolvedValue = await handlerPromise!;

      expect(resolvedValue).toEqual(response);
    });

    it("resolves promise when resolveElicitation is called with cancel", async () => {
      const { result } = renderHook(() => useElicitation());

      const request: ElicitRequest = {
        method: "elicitation/create",
        params: {
          message: "Provide input",
          requestedSchema: {
            type: "object",
            properties: {
              value: { type: "string" },
            },
          },
        },
      };

      let handlerPromise: Promise<TamboElicitationResponse>;
      const extra = createMockExtra();
      act(() => {
        handlerPromise = result.current.defaultElicitationHandler(
          request,
          extra,
        );
      });

      const response: TamboElicitationResponse = {
        action: "cancel",
      };

      act(() => {
        result.current.resolveElicitation?.(response);
      });

      const resolvedValue = await handlerPromise!;

      expect(resolvedValue).toEqual(response);
    });

    it("handles multiple sequential elicitations", async () => {
      const { result } = renderHook(() => useElicitation());

      // First elicitation
      const request1: ElicitRequest = {
        method: "elicitation/create",
        params: {
          message: "First request",
          requestedSchema: {
            type: "object",
            properties: {
              field1: { type: "string" },
            },
          },
        },
      };

      let promise1: Promise<TamboElicitationResponse>;
      const extra1 = createMockExtra();
      act(() => {
        promise1 = result.current.defaultElicitationHandler(request1, extra1);
      });

      expect(result.current.elicitation?.message).toBe("First request");

      act(() => {
        result.current.resolveElicitation?.({
          action: "accept",
          content: { field1: "value1" },
        });
      });

      const result1 = await promise1!;
      expect(result1).toEqual({
        action: "accept",
        content: { field1: "value1" },
      });

      // Second elicitation
      const request2: ElicitRequest = {
        method: "elicitation/create",
        params: {
          message: "Second request",
          requestedSchema: {
            type: "object",
            properties: { field2: { type: "number" } },
          },
        },
      };

      let promise2: Promise<TamboElicitationResponse>;
      const extra2 = createMockExtra();
      act(() => {
        promise2 = result.current.defaultElicitationHandler(request2, extra2);
      });

      expect(result.current.elicitation?.message).toBe("Second request");

      act(() => {
        result.current.resolveElicitation?.({
          action: "accept",
          content: { field2: 42 },
        });
      });

      const result2 = await promise2!;
      expect(result2).toEqual({
        action: "accept",
        content: { field2: 42 },
      });
    });

    it("maintains stable handler reference across re-renders", () => {
      const { result, rerender } = renderHook(() => useElicitation());

      const firstHandler = result.current.defaultElicitationHandler;

      rerender();

      const secondHandler = result.current.defaultElicitationHandler;

      expect(firstHandler).toBe(secondHandler);
    });
  });

  describe("state management", () => {
    it("allows manual state updates via setElicitation", () => {
      const { result } = renderHook(() => useElicitation());

      const customElicitation: TamboElicitationRequest = {
        message: "Custom message",
        requestedSchema: {
          type: "object",
          properties: {
            custom: { type: "boolean" },
          },
        },
      };

      act(() => {
        result.current.setElicitation(customElicitation);
      });

      expect(result.current.elicitation).toEqual(customElicitation);
    });

    it("allows clearing elicitation state", () => {
      const { result } = renderHook(() => useElicitation());

      const elicitation: TamboElicitationRequest = {
        message: "Test",
        requestedSchema: {
          type: "object",
          properties: {},
        },
      };

      act(() => {
        result.current.setElicitation(elicitation);
      });

      expect(result.current.elicitation).not.toBeNull();

      act(() => {
        result.current.setElicitation(null);
      });

      expect(result.current.elicitation).toBeNull();
    });
  });
});
