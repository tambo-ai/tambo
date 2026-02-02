import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { currentPageContextHelper } from "./current-page.js";
import { currentTimeContextHelper } from "./current-time.js";

describe("currentPageContextHelper", () => {
  const originalWindow = global.window;
  const originalDocument = global.document;

  afterEach(() => {
    // Restore originals
    global.window = originalWindow;
    global.document = originalDocument;
  });

  it("should return null when window is undefined (SSR)", () => {
    // @ts-expect-error - simulating SSR environment
    global.window = undefined;
    expect(currentPageContextHelper()).toBeNull();
  });

  it("should return null when document is undefined (SSR)", () => {
    // @ts-expect-error - simulating SSR environment
    global.document = undefined;
    expect(currentPageContextHelper()).toBeNull();
  });

  it("should return page context in browser environment", () => {
    // Mock window and document
    global.window = {
      location: {
        href: "https://example.com/path?query=1",
        pathname: "/path",
        hostname: "example.com",
      },
    } as unknown as Window & typeof globalThis;

    global.document = {
      title: "Test Page",
    } as unknown as Document;

    const result = currentPageContextHelper();

    expect(result).toEqual({
      url: "https://example.com/path?query=1",
      pathname: "/path",
      title: "Test Page",
      hostname: "example.com",
    });
  });
});

describe("currentTimeContextHelper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return current time context", () => {
    const mockDate = new Date("2024-01-15T10:30:00.000Z");
    vi.setSystemTime(mockDate);

    const result = currentTimeContextHelper();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("iso");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("timezone");
    expect(result).toHaveProperty("localString");
  });

  it("should return correct ISO string", () => {
    const mockDate = new Date("2024-01-15T10:30:00.000Z");
    vi.setSystemTime(mockDate);

    const result = currentTimeContextHelper() as { iso: string } | null;

    expect(result?.iso).toBe("2024-01-15T10:30:00.000Z");
  });

  it("should return correct timestamp", () => {
    const mockDate = new Date("2024-01-15T10:30:00.000Z");
    vi.setSystemTime(mockDate);

    const result = currentTimeContextHelper() as { timestamp: number } | null;

    expect(result?.timestamp).toBe(mockDate.getTime());
  });

  it("should return a timezone string", () => {
    const result = currentTimeContextHelper() as { timezone: string } | null;

    expect(typeof result?.timezone).toBe("string");
    expect(result?.timezone.length).toBeGreaterThan(0);
  });

  it("should return a localString", () => {
    const result = currentTimeContextHelper() as { localString: string } | null;

    expect(typeof result?.localString).toBe("string");
    expect(result?.localString.length).toBeGreaterThan(0);
  });
});
