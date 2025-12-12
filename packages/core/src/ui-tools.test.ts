import { UI_TOOLNAME_PREFIX } from "./ui-tools";

describe("ui-tools", () => {
  it("uses the expected UI tool name prefix", () => {
    expect(UI_TOOLNAME_PREFIX).toBe("show_component_");
  });
});
