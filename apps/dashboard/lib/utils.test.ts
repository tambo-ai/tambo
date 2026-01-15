import { absoluteUrl, cn, constructMetadata, formatDate } from "@/lib/utils";

describe("utils", () => {
  test("cn merges class names with tailwind-merge semantics", () => {
    expect(cn("px-2", "px-4", { hidden: false, block: true })).toBe(
      "px-4 block",
    );
  });

  test("absoluteUrl uses siteConfig.url fallback", () => {
    expect(absoluteUrl("/x")).toBe("http://localhost:8260/x");
  });

  test("constructMetadata builds expected metadata", () => {
    const meta = constructMetadata({
      title: "Hello",
      description: "World",
      path: "/a",
    });
    expect(
      meta.title && typeof meta.title === "object" && "default" in meta.title,
    ).toBe(true);
    // spot check key fields
    // @ts-expect-error openGraph is present
    expect(meta.openGraph.title).toBe("Hello");
    // @ts-expect-error alternates exists
    expect(meta.alternates.canonical).toBe("http://localhost:8260/a");
  });

  test("formatDate produces Today for same-day", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-12T12:00:00Z"));
    expect(formatDate("2025-09-12")).toBe("Today");
    jest.useRealTimers();
  });

  test("formatDate shows days and weeks ago for past dates", () => {
    jest.useFakeTimers();
    // Fix timezone: set to midday UTC to avoid local tz rollovers
    jest.setSystemTime(new Date("2025-09-12T12:00:00Z"));
    expect(formatDate("2025-09-11")).toContain("(1d ago)");
    expect(formatDate("2025-09-05")).toContain("(1w ago)");
    jest.useRealTimers();
  });
});
