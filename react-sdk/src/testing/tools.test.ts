import type { TamboComponent } from "../model/component-metadata";
import { serializeRegistry } from "./tools";

describe("serializeRegistry", () => {
  it("serializes a component with a JSON Schema propsSchema", () => {
    const registry: TamboComponent[] = [
      {
        name: "TestComp",
        description: "A test component",
        component: () => null,
        propsSchema: { type: "object", properties: { x: { type: "number" } } },
      },
    ];

    const result = serializeRegistry(registry);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("TestComp");
    expect(result[0].props).toEqual({
      type: "object",
      properties: { x: { type: "number" } },
    });
    // component should be stripped
    expect(result[0]).not.toHaveProperty("component");
    expect(result[0]).not.toHaveProperty("propsSchema");
  });

  it("maps associatedTools to contextTools", () => {
    const registry: TamboComponent[] = [
      {
        name: "WithTools",
        description: "Has tools",
        component: () => null,
        propsSchema: { type: "object", properties: {} },
        associatedTools: [
          {
            name: "myTool",
            description: "does stuff",
            tool: () => "ok",
            inputSchema: { type: "object", properties: {} },
            outputSchema: { type: "object" },
          },
        ],
      },
    ];

    const result = serializeRegistry(registry);
    expect(result[0].contextTools).toHaveLength(1);
    expect(result[0].contextTools![0].name).toBe("myTool");
  });

  it("handles undefined associatedTools", () => {
    const registry: TamboComponent[] = [
      {
        name: "NoTools",
        description: "No tools",
        component: () => null,
        propsSchema: { type: "object", properties: {} },
      },
    ];

    const result = serializeRegistry(registry);
    expect(result[0].contextTools).toBeUndefined();
  });
});
