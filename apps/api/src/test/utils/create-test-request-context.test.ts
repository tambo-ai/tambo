import { createTestRequestContext } from "./create-test-request-context";

describe("createTestRequestContext", () => {
  it("creates a new ContextId and returns the provided request object", () => {
    const request = {
      headers: {
        authorization: "Bearer test",
      },
    };

    const context = createTestRequestContext(request);
    const authorization: string = context.request.headers.authorization;

    expect(context.request).toBe(request);
    expect(authorization).toBe("Bearer test");
    expect(context.contextId).toBeDefined();
  });

  it("defaults request to an empty object", () => {
    const context1 = createTestRequestContext();
    const context2 = createTestRequestContext();

    expect(context1.request).toEqual({});
    expect(context2.request).toEqual({});
    expect(context1.request).not.toBe(context2.request);
    expect(context1.contextId).not.toBe(context2.contextId);
  });
});
