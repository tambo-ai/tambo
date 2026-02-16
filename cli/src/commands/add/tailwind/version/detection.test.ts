import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import path from "path";

jest.unstable_mockModule("fs", () => ({
  default: {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const { default: fs } = await import("fs");
const { detectTailwindVersion, isV4OrLater } = await import("./detection");

describe("detectTailwindVersion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when package.json does not exist", () => {
    (fs.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(false);
    expect(detectTailwindVersion("/project")).toBeNull();
  });

  it("returns null when tailwindcss is not in dependencies", () => {
    (fs.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFileSync as ReturnType<typeof jest.fn>).mockReturnValue(
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    expect(detectTailwindVersion("/project")).toBeNull();
  });

  it("detects tailwindcss from dependencies", () => {
    (fs.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFileSync as ReturnType<typeof jest.fn>).mockReturnValue(
      JSON.stringify({ dependencies: { tailwindcss: "^4.1.0" } }),
    );
    expect(detectTailwindVersion("/project")).toBe("4.1.0");
  });

  it("detects tailwindcss from devDependencies", () => {
    (fs.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFileSync as ReturnType<typeof jest.fn>).mockReturnValue(
      JSON.stringify({ devDependencies: { tailwindcss: "^3.4.1" } }),
    );
    expect(detectTailwindVersion("/project")).toBe("3.4.1");
  });

  it("prefers dependencies over devDependencies", () => {
    (fs.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFileSync as ReturnType<typeof jest.fn>).mockReturnValue(
      JSON.stringify({
        dependencies: { tailwindcss: "^4.0.0" },
        devDependencies: { tailwindcss: "^3.0.0" },
      }),
    );
    expect(detectTailwindVersion("/project")).toBe("4.0.0");
  });

  it("handles exact version strings", () => {
    (fs.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFileSync as ReturnType<typeof jest.fn>).mockReturnValue(
      JSON.stringify({ dependencies: { tailwindcss: "4.0.0" } }),
    );
    expect(detectTailwindVersion("/project")).toBe("4.0.0");
  });

  it("returns null on read errors", () => {
    (fs.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFileSync as ReturnType<typeof jest.fn>).mockImplementation(() => {
      throw new Error("EACCES");
    });
    expect(detectTailwindVersion("/project")).toBeNull();
  });

  it("reads from the correct path", () => {
    (fs.existsSync as ReturnType<typeof jest.fn>).mockReturnValue(true);
    (fs.readFileSync as ReturnType<typeof jest.fn>).mockReturnValue(
      JSON.stringify({ dependencies: { tailwindcss: "^4.0.0" } }),
    );
    detectTailwindVersion("/my/project");
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join("/my/project", "package.json"),
      "utf-8",
    );
  });
});

describe("isV4OrLater", () => {
  it("returns true for v4", () => {
    expect(isV4OrLater("4.0.0")).toBe(true);
  });

  it("returns true for v4.x", () => {
    expect(isV4OrLater("4.1.0")).toBe(true);
  });

  it("returns false for v3", () => {
    expect(isV4OrLater("3.4.1")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isV4OrLater(null)).toBe(false);
  });
});
