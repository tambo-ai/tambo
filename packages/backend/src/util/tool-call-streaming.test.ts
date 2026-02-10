import { JSONSchema7 } from "json-schema";
import { ToolCallStreamTracker } from "./tool-call-streaming";

const simpleSchema: JSONSchema7 = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
  },
  required: ["name"],
};

describe("ToolCallStreamTracker", () => {
  it("should emit args_delta events as JSON is incrementally parsed", () => {
    const tracker = new ToolCallStreamTracker("tc_1", simpleSchema);

    // Stream the opening brace and first property
    const events1 = tracker.processJsonDelta('{"name": "Jo');
    expect(events1).toHaveLength(1);
    const event1 = events1[0];
    expect(event1.name).toBe("tambo.tool_call.args_delta");
    const value1 = event1.value as {
      operations: Array<{ op: string; path: string; value: unknown }>;
    };
    expect(value1.operations).toEqual([
      { op: "add", path: "/name", value: "Jo" },
    ]);

    // Continue streaming the name
    const events2 = tracker.processJsonDelta('hn"');
    expect(events2).toHaveLength(1);
    const value2 = events2[0].value as {
      operations: Array<{ op: string; path: string; value: unknown }>;
    };
    expect(value2.operations).toEqual([
      { op: "replace", path: "/name", value: "John" },
    ]);
  });

  it("should strip null values for optional non-nullable params", () => {
    const tracker = new ToolCallStreamTracker("tc_1", simpleSchema);

    // age is optional (not in required array) and not nullable → should be stripped
    const events = tracker.processJsonDelta('{"name": "John", "age": null}');

    // Should see "name" added but NOT "age" (it's null and optional)
    const allOps = events.flatMap(
      (e) => (e.value as { operations: Array<{ path: string }> }).operations,
    );
    const paths = allOps.map((op) => op.path);
    expect(paths).toContain("/name");
    expect(paths).not.toContain("/age");
  });

  it("should preserve _tambo_* pass-through params", () => {
    const tracker = new ToolCallStreamTracker("tc_1", simpleSchema);

    const events = tracker.processJsonDelta(
      '{"name": "John", "_tambo_statusMessage": "Processing"}',
    );

    const allOps = events.flatMap(
      (e) =>
        (e.value as { operations: Array<{ path: string; value: unknown }> })
          .operations,
    );
    const statusOp = allOps.find((op) => op.path === "/_tambo_statusMessage");
    expect(statusOp).toBeDefined();
    expect(statusOp?.value).toBe("Processing");
  });

  it("should emit tool_call.end on finalize with clean args", () => {
    const tracker = new ToolCallStreamTracker("tc_1", simpleSchema);

    tracker.processJsonDelta('{"name": "John", "age": null}');
    const endEvents = tracker.finalize();

    expect(endEvents).toHaveLength(1);
    const endEvent = endEvents[0];
    expect(endEvent.name).toBe("tambo.tool_call.end");
    const value = endEvent.value as {
      toolCallId: string;
      finalArgs: Record<string, unknown>;
    };
    expect(value.toolCallId).toBe("tc_1");
    expect(value.finalArgs).toEqual({ name: "John" });
  });

  it("should track streaming status correctly", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        name: { type: "string" },
        city: { type: "string" },
      },
      required: ["name", "city"],
    };
    const tracker = new ToolCallStreamTracker("tc_1", schema);

    // First property appears
    const events1 = tracker.processJsonDelta('{"name": "J');
    const value1 = events1[0].value as {
      streamingStatus: Record<string, string>;
    };
    expect(value1.streamingStatus.name).toBe("started");

    // First property updates, second property starts
    const events2 = tracker.processJsonDelta('ohn", "city": "NY"');
    const value2 = events2[0].value as {
      streamingStatus: Record<string, string>;
    };
    // name should be done since a new property appeared
    expect(value2.streamingStatus.name).toBe("done");
    expect(value2.streamingStatus.city).toBe("started");
  });

  it("should handle nested object unstrictification", () => {
    const nestedSchema: JSONSchema7 = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
          },
          required: ["name"],
        },
      },
      required: ["user"],
    };

    const tracker = new ToolCallStreamTracker("tc_1", nestedSchema);
    tracker.processJsonDelta('{"user": {"name": "John", "email": null}}');
    const endEvents = tracker.finalize();

    const value = endEvents[0].value as {
      finalArgs: Record<string, unknown>;
    };
    expect(value.finalArgs).toEqual({ user: { name: "John" } });
  });

  it("should throw on oversized JSON", () => {
    const tracker = new ToolCallStreamTracker("tc_1", simpleSchema);
    const huge = "x".repeat(10 * 1024 * 1024 + 1);

    expect(() => tracker.processJsonDelta(huge)).toThrow(
      /exceeds maximum size/,
    );
  });

  it("should throw on unparseable final JSON", () => {
    const tracker = new ToolCallStreamTracker("tc_1", simpleSchema);
    tracker.processJsonDelta('{"name": "incomplete');

    expect(() => tracker.finalize()).toThrow(/failed to parse final JSON/);
  });

  it("should return empty events for unparseable intermediate deltas", () => {
    const tracker = new ToolCallStreamTracker("tc_1", simpleSchema);
    // Just an opening brace — not parseable by partial-json into an object with props
    const events = tracker.processJsonDelta("{");
    expect(events).toHaveLength(0);
  });
});
