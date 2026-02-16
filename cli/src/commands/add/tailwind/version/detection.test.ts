import fs from "fs";
import path from "path";
import { detectTailwindVersion, isV4OrLater } from "./detection";

jest.mock("fs");

const mockFs = jest.mocked(fs);

describe("detectTailwindVersion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when package.json does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(detectTailwindVersion("/project")).toBeNull();
  });

  it("returns null when tailwindcss is not in dependencies", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
    );
    expect(detectTailwindVersion("/project")).toBeNull();
  });

  it("detects tailwindcss from dependencies", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ dependencies: { tailwindcss: "^4.1.0" } }),
    );
    expect(detectTailwindVersion("/project")).toBe("4.1.0");
  });

  it("detects tailwindcss from devDependencies", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ devDependencies: { tailwindcss: "^3.4.1" } }),
    );
    expect(detectTailwindVersion("/project")).toBe("3.4.1");
  });

  it("prefers dependencies over devDependencies", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({
        dependencies: { tailwindcss: "^4.0.0" },
        devDependencies: { tailwindcss: "^3.0.0" },
      }),
    );
    expect(detectTailwindVersion("/project")).toBe("4.0.0");
  });

  it("handles exact version strings", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ dependencies: { tailwindcss: "4.0.0" } }),
    );
    expect(detectTailwindVersion("/project")).toBe("4.0.0");
  });

  it("returns null on read errors", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockImplementation(() => {
      throw new Error("EACCES");
    });
    expect(detectTailwindVersion("/project")).toBeNull();
  });

  it("reads from the correct path", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ dependencies: { tailwindcss: "^4.0.0" } }),
    );
    detectTailwindVersion("/my/project");
    expect(mockFs.readFileSync).toHaveBeenCalledWith(
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
