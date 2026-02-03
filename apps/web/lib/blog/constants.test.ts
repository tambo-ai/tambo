import { CATEGORY_COLORS, CATEGORY_DISPLAY_MAP } from "./constants";

describe("CATEGORY_DISPLAY_MAP", () => {
  it("has display names for all categories", () => {
    expect(CATEGORY_DISPLAY_MAP.new).toBe("New");
    expect(CATEGORY_DISPLAY_MAP.feature).toBe("Feature");
    expect(CATEGORY_DISPLAY_MAP["bug fix"]).toBe("Bug Fix");
    expect(CATEGORY_DISPLAY_MAP.update).toBe("Update");
    expect(CATEGORY_DISPLAY_MAP.event).toBe("Event");
    expect(CATEGORY_DISPLAY_MAP.tutorial).toBe("Tutorial");
    expect(CATEGORY_DISPLAY_MAP.announcement).toBe("Announcement");
  });
});

describe("CATEGORY_COLORS", () => {
  it("has color classes for all categories", () => {
    expect(CATEGORY_COLORS.new).toContain("bg-");
    expect(CATEGORY_COLORS.feature).toContain("bg-");
    expect(CATEGORY_COLORS["bug fix"]).toContain("bg-");
    expect(CATEGORY_COLORS.update).toContain("bg-");
    expect(CATEGORY_COLORS.event).toContain("bg-");
    expect(CATEGORY_COLORS.tutorial).toContain("bg-");
    expect(CATEGORY_COLORS.announcement).toContain("bg-");
  });

  it("has text color classes for all categories", () => {
    expect(CATEGORY_COLORS.new).toContain("text-");
    expect(CATEGORY_COLORS.feature).toContain("text-");
    expect(CATEGORY_COLORS["bug fix"]).toContain("text-");
    expect(CATEGORY_COLORS.update).toContain("text-");
    expect(CATEGORY_COLORS.event).toContain("text-");
    expect(CATEGORY_COLORS.tutorial).toContain("text-");
    expect(CATEGORY_COLORS.announcement).toContain("text-");
  });
});
