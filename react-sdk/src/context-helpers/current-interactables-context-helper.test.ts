import {
  currentInteractablesContextHelper,
  createInteractablesContextHelper,
} from "./current-interactables-context-helper";

describe("currentInteractablesContextHelper", () => {
  it("returns null by default (placeholder before provider replaces it)", () => {
    expect(currentInteractablesContextHelper()).toBeNull();
  });
});

describe("createInteractablesContextHelper", () => {
  it("returns null when components array is empty", () => {
    const helper = createInteractablesContextHelper([]);
    expect(helper()).toBeNull();
  });

  it("maps valid component objects to metadata", () => {
    const components = [
      {
        id: "comp-1",
        name: "WeatherCard",
        description: "Shows weather",
        props: { city: "NYC" },
        propsSchema: { type: "object" },
        state: { temp: 72 },
        isSelected: true,
        stateSchema: { type: "object" },
      },
    ];

    const helper = createInteractablesContextHelper(components);
    const result = helper();
    expect(result).toEqual({
      components: [
        {
          id: "comp-1",
          componentName: "WeatherCard",
          description: "Shows weather",
          props: { city: "NYC" },
          propsSchema: "Available - use component-specific update tools",
          state: { temp: 72 },
          isSelected: true,
          stateSchema: "Available - use component-specific update tools",
        },
      ],
    });
  });

  it("handles invalid (non-object) components gracefully", () => {
    const components = [null, "not-an-object", 42];

    const helper = createInteractablesContextHelper(components);
    const result = helper();
    expect(result?.components).toHaveLength(3);
    for (const comp of result?.components ?? []) {
      expect(comp.id).toBe("unknown");
      expect(comp.componentName).toBe("unknown");
    }
  });

  it("uses defaults for missing properties", () => {
    const components = [{}];

    const helper = createInteractablesContextHelper(components);
    const result = helper();
    expect(result?.components[0]).toEqual({
      id: "unknown",
      componentName: "unknown",
      description: "",
      props: undefined,
      propsSchema: "Not specified",
      state: undefined,
      isSelected: false,
      stateSchema: "Not specified",
    });
  });
});
