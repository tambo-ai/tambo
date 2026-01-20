import { EventType } from "@ag-ui/core";
import { parse as parsePartialJson } from "partial-json";
import {
  ComponentStreamTracker,
  isComponentTool,
  tryExtractComponentName,
  extractComponentName,
} from "./component-streaming";

describe("component-streaming", () => {
  it("partial-json parse returns fresh objects for identical input", () => {
    const first = parsePartialJson('{"a": 1}') as { a: number };
    const second = parsePartialJson('{"a": 1}') as { a: number };

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  describe("isComponentTool", () => {
    it("returns true for component tools", () => {
      expect(isComponentTool("show_component_WeatherCard")).toBe(true);
      expect(isComponentTool("show_component_StockChart")).toBe(true);
      expect(isComponentTool("show_component_")).toBe(false);
    });

    it("returns false for non-component tools", () => {
      expect(isComponentTool("get_weather")).toBe(false);
      expect(isComponentTool("show_weather")).toBe(false);
      expect(isComponentTool("")).toBe(false);
    });
  });

  describe("extractComponentName", () => {
    it("extracts component name from tool name", () => {
      expect(extractComponentName("show_component_WeatherCard")).toBe(
        "WeatherCard",
      );
      expect(extractComponentName("show_component_StockChart")).toBe(
        "StockChart",
      );
    });

    it("throws for prefix-only tool name", () => {
      expect(() => extractComponentName("show_component_")).toThrow(
        "Invalid component tool name",
      );
    });

    it("throws for non-component tool name", () => {
      expect(() => extractComponentName("get_weather")).toThrow(
        "Invalid component tool name",
      );
    });
  });

  describe("tryExtractComponentName", () => {
    it("returns the component name for valid component tools", () => {
      expect(tryExtractComponentName("show_component_WeatherCard")).toBe(
        "WeatherCard",
      );
    });

    it("returns undefined for invalid tool names", () => {
      expect(tryExtractComponentName("show_component_")).toBeUndefined();
      expect(tryExtractComponentName("get_weather")).toBeUndefined();
    });
  });

  describe("ComponentStreamTracker", () => {
    it("emits start event on first delta", () => {
      const tracker = new ComponentStreamTracker("comp_123", "WeatherCard");

      const events = tracker.processJsonDelta("{");

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EventType.CUSTOM);
      expect((events[0] as unknown as { name: string }).name).toBe(
        "tambo.component.start",
      );
      expect(
        (
          events[0] as unknown as {
            value: { componentId: string; name: string };
          }
        ).value,
      ).toEqual({
        componentId: "comp_123",
        name: "WeatherCard",
      });
    });

    it("emits props_delta when new property is detected", () => {
      const tracker = new ComponentStreamTracker("comp_123", "WeatherCard");

      // First delta - start event
      tracker.processJsonDelta('{"tem');
      // Second delta - still parsing
      const events2 = tracker.processJsonDelta('perature": 72}');

      // Should have props_delta event for the complete property
      const propsDeltaEvent = events2.find(
        (e) =>
          (e as unknown as { name: string }).name ===
          "tambo.component.props_delta",
      );

      expect(propsDeltaEvent).toBeDefined();
      expect(
        (propsDeltaEvent as unknown as { value: { patch: unknown[] } }).value
          .patch,
      ).toContainEqual({
        op: "add",
        path: "/temperature",
        value: 72,
      });
    });

    it("escapes JSON Pointer segments in patch paths", () => {
      const tracker = new ComponentStreamTracker("comp_123", "WeirdKeys");

      const events = tracker.processJsonDelta('{"foo/bar": 1, "til~de": 2}');

      const propsDeltaEvent = events.find(
        (e) =>
          (e as unknown as { name: string }).name ===
          "tambo.component.props_delta",
      );

      expect(propsDeltaEvent).toBeDefined();
      expect(
        (propsDeltaEvent as unknown as { value: { patch: unknown[] } }).value
          .patch,
      ).toContainEqual({
        op: "add",
        path: "/foo~1bar",
        value: 1,
      });
      expect(
        (propsDeltaEvent as unknown as { value: { patch: unknown[] } }).value
          .patch,
      ).toContainEqual({
        op: "add",
        path: "/til~0de",
        value: 2,
      });
    });

    it("escapes JSON Pointer segments in replace patches", () => {
      const tracker = new ComponentStreamTracker("comp_123", "WeirdKeys");

      tracker.processJsonDelta('{"foo/bar": "Hel');
      const events = tracker.processJsonDelta('lo"}');

      const propsDeltaEvent = events.find(
        (e) =>
          (e as unknown as { name: string }).name ===
          "tambo.component.props_delta",
      );

      expect(propsDeltaEvent).toBeDefined();
      expect(
        (propsDeltaEvent as unknown as { value: { patch: unknown[] } }).value
          .patch,
      ).toContainEqual({
        op: "replace",
        path: "/foo~1bar",
        value: "Hello",
      });
    });

    it("handles empty-string keys in JSON Pointer paths", () => {
      const tracker = new ComponentStreamTracker("comp_123", "WeirdKeys");

      const events = tracker.processJsonDelta('{"": 1}');
      const propsDeltaEvent = events.find(
        (e) =>
          (e as unknown as { name: string }).name ===
          "tambo.component.props_delta",
      );

      expect(propsDeltaEvent).toBeDefined();
      expect(
        (propsDeltaEvent as unknown as { value: { patch: unknown[] } }).value
          .patch,
      ).toContainEqual({
        op: "add",
        path: "/",
        value: 1,
      });
    });

    it("tracks streaming status correctly", () => {
      const tracker = new ComponentStreamTracker("comp_123", "WeatherCard");

      // First delta: temperature is seen, starts as "started"
      tracker.processJsonDelta('{"temperature": 72');
      // Second delta: location is seen as NEW property, so temperature becomes "done"
      // but location starts as "started" (only "done" when next prop appears)
      const events = tracker.processJsonDelta(', "location": "NYC"}');

      const propsDeltaEvent = events.find(
        (e) =>
          (e as unknown as { name: string }).name ===
          "tambo.component.props_delta",
      );

      expect(propsDeltaEvent).toBeDefined();
      const value = (
        propsDeltaEvent as unknown as {
          value: { streamingStatus: Record<string, string> };
        }
      ).value;
      // temperature should be "done" because location was seen after it
      expect(value.streamingStatus.temperature).toBe("done");
      // location should be "started" because no property has been seen after it yet
      expect(value.streamingStatus.location).toBe("started");
    });

    it("emits end event on finalize", () => {
      const tracker = new ComponentStreamTracker("comp_123", "WeatherCard");

      tracker.processJsonDelta('{"temperature": 72, "location": "NYC"}');
      const endEvents = tracker.finalize();

      expect(endEvents).toHaveLength(1);
      expect((endEvents[0] as unknown as { name: string }).name).toBe(
        "tambo.component.end",
      );
      expect(
        (
          endEvents[0] as unknown as {
            value: { finalProps: Record<string, unknown> };
          }
        ).value.finalProps,
      ).toEqual({
        temperature: 72,
        location: "NYC",
      });
    });

    it("handles incremental string property streaming", () => {
      const tracker = new ComponentStreamTracker("comp_123", "TextDisplay");

      // Start with partial string
      tracker.processJsonDelta('{"text": "Hello');

      // Complete the string
      const events = tracker.processJsonDelta(' World"}');

      // Should detect the change
      const propsDeltaEvent = events.find(
        (e) =>
          (e as unknown as { name: string }).name ===
          "tambo.component.props_delta",
      );

      expect(propsDeltaEvent).toBeDefined();
    });

    it("handles nested object properties", () => {
      const tracker = new ComponentStreamTracker("comp_123", "DataCard");

      // Collect all events across the streaming
      const allEvents = [
        ...tracker.processJsonDelta('{"data": {"x": 1, "y": 2'),
        ...tracker.processJsonDelta("}}"),
      ];

      // Find any props_delta event
      const propsDeltaEvents = allEvents.filter(
        (e) =>
          (e as unknown as { name: string }).name ===
          "tambo.component.props_delta",
      );

      // At least one props_delta should have been emitted
      expect(propsDeltaEvents.length).toBeGreaterThan(0);

      // Check that data property was included in at least one patch
      const hasDataPatch = propsDeltaEvents.some((event) => {
        const value = (
          event as unknown as { value: { patch: Array<{ path: string }> } }
        ).value;
        return value.patch.some((p) => p.path === "/data");
      });
      expect(hasDataPatch).toBe(true);

      // Verify the final state through finalize
      const endEvents = tracker.finalize();
      const endEvent = endEvents.find(
        (e) =>
          (e as unknown as { name: string }).name === "tambo.component.end",
      );
      expect(endEvent).toBeDefined();
      expect(
        (
          endEvent as unknown as {
            value: { finalProps: Record<string, unknown> };
          }
        ).value.finalProps,
      ).toEqual({ data: { x: 1, y: 2 } });
    });

    it("handles array properties", () => {
      const tracker = new ComponentStreamTracker("comp_123", "ListComponent");

      tracker.processJsonDelta('{"items": [1, 2');
      const events = tracker.processJsonDelta(", 3]}");

      const propsDeltaEvent = events.find(
        (e) =>
          (e as unknown as { name: string }).name ===
          "tambo.component.props_delta",
      );

      expect(propsDeltaEvent).toBeDefined();
      const value = (
        propsDeltaEvent as unknown as {
          value: { patch: Array<{ path: string; value: unknown }> };
        }
      ).value;
      const addPatch = value.patch.find((p) => p.path === "/items");
      expect(addPatch?.value).toEqual([1, 2, 3]);
    });

    it("handles empty JSON gracefully", () => {
      const tracker = new ComponentStreamTracker("comp_123", "EmptyComponent");

      tracker.processJsonDelta("{}");
      const endEvents = tracker.finalize();

      expect(endEvents).toHaveLength(1);
      expect(
        (
          endEvents[0] as unknown as {
            value: { finalProps: Record<string, unknown> };
          }
        ).value.finalProps,
      ).toEqual({});
    });

    it("returns empty events for invalid JSON during streaming", () => {
      const tracker = new ComponentStreamTracker("comp_123", "Test");

      // First call gets start event
      const startEvents = tracker.processJsonDelta("{");
      expect(startEvents).toHaveLength(1);

      // Incomplete JSON - no additional events
      const events = tracker.processJsonDelta("broken");
      expect(events).toHaveLength(0);
    });

    it("detects property updates", () => {
      const tracker = new ComponentStreamTracker("comp_123", "Counter");

      // Initial value
      tracker.processJsonDelta('{"count": 1}');

      // This won't actually update in normal streaming, but let's test the replace logic
      // by simulating a scenario where we start fresh tracking
      const tracker2 = new ComponentStreamTracker("comp_456", "Counter");
      tracker2.processJsonDelta('{"count": 1}');
      // Since we can't directly test replace in streaming (JSON only grows),
      // we test that the tracker handles the case correctly
      const events = tracker2.finalize();
      expect(events).toHaveLength(1);
    });

    it("throws error when JSON exceeds 10MB limit", () => {
      const tracker = new ComponentStreamTracker(
        "comp_large",
        "LargeComponent",
      );

      // Send a chunk that exceeds the 10MB limit
      const oversizedChunk = '{"data": "' + "x".repeat(10 * 1024 * 1024) + '"}';

      expect(() => {
        tracker.processJsonDelta(oversizedChunk);
      }).toThrow(
        "Component comp_large (LargeComponent) JSON exceeds maximum size of",
      );
    });

    it("throws error when accumulated JSON exceeds 10MB limit", () => {
      const tracker = new ComponentStreamTracker(
        "comp_large",
        "LargeComponent",
      );

      // Send a chunk close to the limit
      const nearLimitChunk = '{"data": "' + "x".repeat(10 * 1024 * 1024 - 100);
      tracker.processJsonDelta(nearLimitChunk);

      // This should throw as it exceeds the limit
      expect(() => {
        tracker.processJsonDelta("y".repeat(200));
      }).toThrow(
        "Component comp_large (LargeComponent) JSON exceeds maximum size of",
      );
    });

    it("throws error when finalize receives unparseable JSON", () => {
      const tracker = new ComponentStreamTracker(
        "comp_broken",
        "BrokenComponent",
      );

      // Use JSON that partial-json cannot parse (starts with closing brace)
      tracker.processJsonDelta("}{");

      // Finalize should throw an error instead of silently falling back
      expect(() => {
        tracker.finalize();
      }).toThrow(
        "Component comp_broken (BrokenComponent) failed to parse final JSON:",
      );
    });
  });
});
