import { createTestRequestContext } from "./create-test-request-context";

describe("createTestRequestContext", () => {
  it("creates a new ContextId and returns the provided request object", () => {
    const request = {
      headers: {
        authorization: "Bearer test",
      },
    };

    const context = createTestRequestContext(request);

    expect(context.request).toBe(request);
    expect(context.contextId).toBeDefined();
  });

  it("defaults request to an empty object", () => {
    const context = createTestRequestContext();
    expect(context.request).toEqual({});
  });
});
