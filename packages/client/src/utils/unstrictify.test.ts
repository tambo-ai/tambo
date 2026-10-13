import { EventType } from "@ag-ui/core";
import type { JSONSchema7 } from "json-schema";
import type { TamboTool } from "../model/component-metadata";
import { ToolCallTracker } from "./tool-call-tracker";
import { executeAllPendingTools } from "./tool-executor";
import { canBeNull, unstrictifyToolCallParamsFromSchema } from "./unstrictify";

describe("nullable JSON Schema type arrays", () => {
  it.each<JSONSchema7>([
    { type: ["string", "null"] },
    { type: ["null", "number"] },
    { type: ["null"] },
    { anyOf: [{ type: "number" }, { type: ["string", "null"] }] },
  ])("recognizes null in %j", (schema) => {
    expect(canBeNull(schema)).toBe(true);
  });

  it.each<JSONSchema7>([{ type: ["string", "number"] }, { type: ["string"] }])(
    "keeps non-nullable type arrays non-nullable in %j",
    (schema) => {
      expect(canBeNull(schema)).toBe(false);
    },
  );

  it("preserves nullable nulls and keeps optional non-nullable defaults", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        nullable: { type: ["string", "null"], default: "unused" },
        optional: { type: ["string", "number"] },
        defaulted: { type: ["string", "number"], default: "fallback" },
      },
    };
    const params = { nullable: null, optional: null, defaulted: null };

    expect(unstrictifyToolCallParamsFromSchema(schema, params)).toEqual({
      nullable: null,
      defaulted: "fallback",
    });
    expect(params).toEqual({ nullable: null, optional: null, defaulted: null });
  });

  it.each([false, true])(
    "passes explicit null to the tool through streaming with default=%s",
    async (hasDefault) => {
      const inputs: unknown[] = [];
      const inputSchema: JSONSchema7 = {
        type: "object",
        properties: {
          title: {
            type: ["string", "null"],
            ...(hasDefault ? { default: "unused" } : {}),
          },
          color: { type: "string" },
        },
      };
      const tool: TamboTool<{ title: string | null; color?: string }, string> =
        {
          name: "update_preferences",
          description: "Update preferences",
          inputSchema,
          outputSchema: { type: "string" },
          tool: (input) => {
            inputs.push(input);
            return JSON.stringify(input);
          },
        };
      const registry = { update_preferences: tool };
      const tracker = new ToolCallTracker(registry);
      tracker.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "call_1",
        toolCallName: tool.name,
        parentMessageId: "message_1",
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"title":null,',
      });
      expect(tracker.parsePartialArgs("call_1")).toEqual({ title: null });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '"color":null}',
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      });

      const results = await executeAllPendingTools(
        tracker.getToolCallsById(["call_1"]),
        registry,
      );

      expect(inputs).toEqual([{ title: null }]);
      expect(results).toEqual([
        {
          type: "tool_result",
          toolUseId: "call_1",
          content: [{ type: "text", text: '{"title":null}' }],
        },
      ]);
    },
  );
});
