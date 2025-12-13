import { isUiToolName, UI_TOOLNAME_PREFIX } from "./ui-tools";

describe("ui-tools", () => {
  it("uses the expected UI tool name prefix", () => {
    expect(UI_TOOLNAME_PREFIX).toBe("show_component_");
  });

  describe("isUiToolName", () => {
    it("returns true for UI tool names", () => {
      expect(isUiToolName(`${UI_TOOLNAME_PREFIX}Graph`)).toBe(true);
      expect(isUiToolName(UI_TOOLNAME_PREFIX)).toBe(true);
    });

    it("returns false for non-UI tool names", () => {
      expect(isUiToolName("tool_Graph")).toBe(false);
      expect(isUiToolName("show_component")).toBe(false);
      expect(isUiToolName("")).toBe(false);
    });

    it("returns false for nullish tool names", () => {
      expect(isUiToolName(undefined)).toBe(false);
      expect(isUiToolName(null)).toBe(false);
    });
  });
});
