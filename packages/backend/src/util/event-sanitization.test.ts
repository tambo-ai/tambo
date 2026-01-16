import { sanitizeEvent } from "./event-sanitization";

describe("sanitizeEvent", () => {
  it("should pass through simple events unchanged", () => {
    const event = {
      type: "RUN_STARTED",
      threadId: "thread-123",
      runId: "run-456",
      timestamp: 1234567890,
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual(event);
  });

  it("should remove stack traces", () => {
    const event = {
      type: "RUN_ERROR",
      message: "An error occurred",
      stack: "Error: An error occurred\n    at ...",
      timestamp: 1234567890,
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual({
      type: "RUN_ERROR",
      message: "An error occurred",
      timestamp: 1234567890,
    });
    expect(sanitized).not.toHaveProperty("stack");
  });

  it("should remove sensitive fields", () => {
    const event = {
      type: "RUN_ERROR",
      message: "Error",
      stackTrace: "full stack trace",
      error_stack: "another stack",
      internalError: "internal details",
      originalError: new Error("original"),
      rawError: { message: "raw" },
      timestamp: 1234567890,
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual({
      type: "RUN_ERROR",
      message: "Error",
      timestamp: 1234567890,
    });
  });

  it("should sanitize nested objects", () => {
    const event = {
      type: "CUSTOM_EVENT",
      data: {
        message: "test",
        stack: "should be removed",
        nested: {
          value: 42,
          internalError: "should be removed",
        },
      },
      timestamp: 1234567890,
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual({
      type: "CUSTOM_EVENT",
      data: {
        message: "test",
        nested: {
          value: 42,
        },
      },
      timestamp: 1234567890,
    });
  });

  it("should sanitize arrays of objects", () => {
    const event = {
      type: "BATCH_EVENT",
      items: [
        {
          id: 1,
          message: "first",
          stack: "remove me",
        },
        {
          id: 2,
          message: "second",
          internalError: "remove me too",
        },
      ],
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual({
      type: "BATCH_EVENT",
      items: [
        {
          id: 1,
          message: "first",
        },
        {
          id: 2,
          message: "second",
        },
      ],
    });
  });

  it("should handle arrays with primitives", () => {
    const event = {
      type: "LIST_EVENT",
      tags: ["tag1", "tag2", "tag3"],
      numbers: [1, 2, 3],
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual(event);
  });

  it("should prevent prototype pollution attacks", () => {
    const event = {
      type: "MALICIOUS_EVENT",
      __proto__: { polluted: true },
      constructor: { payload: "bad" },
      prototype: { attack: "dangerous" },
      normalField: "safe",
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual({
      type: "MALICIOUS_EVENT",
      normalField: "safe",
    });
    // Check that these sensitive fields are not own properties
    expect(Object.hasOwn(sanitized, "__proto__")).toBe(false);
    expect(Object.hasOwn(sanitized, "constructor")).toBe(false);
    expect(Object.hasOwn(sanitized, "prototype")).toBe(false);
  });

  it("should handle null and undefined values", () => {
    const event = {
      type: "NULL_EVENT",
      nullValue: null,
      undefinedValue: undefined,
      normalValue: "test",
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual({
      type: "NULL_EVENT",
      nullValue: null,
      undefinedValue: undefined,
      normalValue: "test",
    });
  });

  it("should not mutate the original event", () => {
    const event = {
      type: "IMMUTABLE_TEST",
      stack: "should not be mutated",
      data: {
        nested: "value",
        internalError: "should not be mutated",
      },
    };

    const original = JSON.stringify(event);
    sanitizeEvent(event);
    const afterSanitization = JSON.stringify(event);

    expect(afterSanitization).toEqual(original);
  });

  it("should remove control characters from strings", () => {
    const event = {
      type: "CONTROL_CHARS",
      message: "Hello\x00World\x01Test\x1F",
      normalText: "Normal text with\nline breaks\tand tabs",
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual({
      type: "CONTROL_CHARS",
      message: "HelloWorldTest",
      normalText: "Normal text with\nline breaks\tand tabs",
    });
  });

  it("should sanitize strings in nested structures", () => {
    const event = {
      type: "NESTED_STRINGS",
      data: {
        text: "Clean\x00text",
        items: ["item1\x01", "item2\x02", "clean"],
      },
    };

    const sanitized = sanitizeEvent(event);

    expect(sanitized).toEqual({
      type: "NESTED_STRINGS",
      data: {
        text: "Cleantext",
        items: ["item1", "item2", "clean"],
      },
    });
  });
});
