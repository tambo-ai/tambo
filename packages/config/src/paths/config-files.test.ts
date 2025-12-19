import { getSupportedConfigFilenames } from "./config-files";

describe("getSupportedConfigFilenames", () => {
  it("returns list of supported filenames", () => {
    const filenames = getSupportedConfigFilenames();

    expect(filenames).toContain("tambo.config.ts");
    expect(filenames).toContain("tambo.config.yaml");
    expect(filenames).toContain("tambo.config.yml");
    expect(filenames).toContain("tambo.config.json");
    expect(filenames).toContain("tambo.config.js");
    expect(filenames).toContain(".tamborc");
    expect(filenames).toContain(".tamborc.yaml");
    expect(filenames).toContain(".tamborc.yml");
    expect(filenames).toContain(".tamborc.json");
  });

  it("returns readonly array", () => {
    const filenames = getSupportedConfigFilenames();

    expect(Array.isArray(filenames)).toBe(true);
  });

  it("has typescript first (highest priority)", () => {
    const filenames = getSupportedConfigFilenames();

    expect(filenames[0]).toBe("tambo.config.ts");
  });
});

// Note: Integration tests for findConfigFiles would require actual filesystem
// operations or more complex mocking. For now, we test the public API shape
// and leave integration testing to the consuming packages.
